const express = require('express');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');
const { Client: NotionClient } = require('@notionhq/client');

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  })
);

const whatsappClient = new Client({
  authStrategy: new LocalAuth(),
});

const notion = new NotionClient({ auth: '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' });
const databaseId = '142711b9c557800a8b97d33046ae825d';

// Almacenar estados previos, recordatorios activos y usuarios en espera de correo electrónico
let previousStates = {};
let activeReminders = {};
let awaitingEmail = {}; // Usuarios esperando correo electrónico

// Verificar cambios en los estados de los pedidos
const checkForUpdates = async () => {
  try {
    console.log('Revisando cambios en Notion...');
    const response = await notion.databases.query({
      database_id: databaseId,
    });

    for (const page of response.results) {
      const pageId = page.id;
      const estado = page.properties['Estado Pedido']?.select?.name || 'Desconocido';
      const telefono = page.properties['Número de Teléfono']?.phone_number || null;
      const cancha = page.properties['Cancha']?.select?.name || 'Cancha desconocida';
      const horaPartido = page.properties['Hora Del Partido']?.rich_text?.[0]?.text?.content || 'Hora no especificada';

      // Detectar cambios en el estado
      if (previousStates[pageId] !== estado && estado === 'Listo') {
        console.log(`Pedido ${pageId} está ahora "Listo". Enviando notificación...`);

        if (telefono) {
          // Enviar mensaje inicial
          await whatsappClient.sendMessage(
            `${telefono}@c.us`,
            `🎉 ¡Tu partido en la cancha ${cancha} está listo para las ${horaPartido}! Escribe *Ok* para proceder con el pago. ⚽`
          );
          console.log(`Mensaje enviado a ${telefono}`);

          // Iniciar recordatorio
          if (!activeReminders[pageId]) {
            activeReminders[pageId] = setInterval(async () => {
              console.log(`Recordatorio para pedido ${pageId}`);
              await whatsappClient.sendMessage(
                `${telefono}@c.us`,
                `⏰ Recordatorio: ¡Tu partido en la cancha ${cancha} está listo! Responde con *Ok* para proceder con el pago.`
              );
            }, 3600000); // 1 hora en milisegundos
          }
        }
      }

      // Actualizar el estado previo
      previousStates[pageId] = estado;
    }
  } catch (error) {
    console.error('Error al revisar estados en Notion:', error);
  }
};

// Revisar los estados cada minuto
setInterval(checkForUpdates, 60000);

// Manejar mensajes entrantes
whatsappClient.on('message', async (message) => {
  console.log('Mensaje recibido (en bruto):', message.body);

  const telefono = message.from.replace('@c.us', '');
  const userMessage = message.body.trim().toLowerCase();

  // Verificar si el usuario está en espera de correo
  if (awaitingEmail[telefono]) {
    awaitingEmail[telefono] = false; // Salir del estado de espera
    await whatsappClient.sendMessage(
      message.from,
      `✅ Gracias por compartir tu correo electrónico. Te enviaremos el enlace de tu partido pronto. 📧`
    );
    console.log(`Correo registrado para el usuario ${telefono}: ${message.body}`);
    return;
  }

  // Manejar respuesta "Ok" para generar pago
  if (userMessage === 'ok') {
    for (const [pageId, reminder] of Object.entries(activeReminders)) {
      const response = await notion.pages.retrieve({ page_id: pageId });
      const userPhone = response.properties['Número de Teléfono']?.phone_number;

      if (userPhone === telefono) {
        console.log(`Respuesta "Ok" recibida del usuario ${telefono} para el pedido ${pageId}.`);

        // Detener recordatorio
        clearInterval(reminder);
        delete activeReminders[pageId];

        // Enviar mensaje de generación de pago
        const paymentLink = 'https://checkout.bold.co/payment/LNK_PJUJJLEW6Q'; // Enlace ficticio
        await whatsappClient.sendMessage(
          message.from,
          `🔗 ¡Gracias! Aquí está el enlace para realizar el pago:
${paymentLink}
Vas a pagar $20.000 COP a NotBaloa. Confirma que el método de pago que elijas:

💸 Tenga dinero disponible.
✅ No esté bloqueado ni restringido.
🛍️ Esté habilitado para compras internacionales si tu tarjeta no es Colombiana.
👌 Tenga topes que le permitan pagar el valor de tu compra.
          `
        );

        // Solicitar correo electrónico
        awaitingEmail[telefono] = true;
        await whatsappClient.sendMessage(
          message.from,
          `📧 ¿Nos puedes compartir tu correo electrónico para enviarte el enlace de tu partido?`
        );

        // Actualizar el estado en Notion
        await notion.pages.update({
          page_id: pageId,
          properties: {
            'Estado Pedido': {
              select: { name: 'Procesando Pago' },
            },
          },
        });

        console.log(`Estado del pedido ${pageId} actualizado a "Procesando Pago".`);
        return;
      }
    }
  }

  // Verificar si es un pedido nuevo
  const usernameMatch = message.body.match(/soy \*(.+?)\*/i);
  const canchaMatch = message.body.match(/cancha\s*:?\s*(.+?)(?:\n|$)/i);
  const fechaPartidoMatch = message.body.match(/\*fecha del partido\*:\s*(\d{2}-\d{2}-\d{4})/i);
  const horaPartidoMatch = message.body.match(/\*hora del partido\*:\s*(\d{2}:\d{2})/i);
  const equiposMatch = message.body.match(/equipos\s*:?\s*(.+?)(?:\n|$)/i);
  const descripcionMatch = message.body.match(/\*descripción\*:\s*(.+?)(?:\n|$)/i);

  const cancha = canchaMatch?.[1]?.trim().replace(/\*/g, '') || 'Desconocida';
  const fechaPartidoOriginal = fechaPartidoMatch?.[1]?.trim() || null;
  const horaPartido = horaPartidoMatch?.[1]?.trim() || 'Desconocida';
  const equipos = equiposMatch?.[1]?.trim().replace(/\*/g, '') || 'Desconocidos';
  const descripcion = descripcionMatch?.[1]?.trim() || 'No especificada';
  const usuario = usernameMatch?.[1]?.trim() || 'Usuario desconocido';

  // Convertir la fecha del partido al formato ISO 8601
  let fechaPartido = null;
  if (fechaPartidoOriginal) {
    const [day, month, year] = fechaPartidoOriginal.split('-');
    fechaPartido = `${year}-${month}-${day}`;
  }

  if (!fechaPartido || horaPartido === 'Desconocida') {
    await whatsappClient.sendMessage(
      message.from,
      `⚠ Error: No se pudo registrar tu pedido porque la fecha o la hora del partido son inválidas. Verifica e inténtalo de nuevo.`
    );
    console.error('Error: Fecha u hora del partido inválida.');
    return;
  }

  try {
    console.log('Intentando guardar el pedido en Notion...');
    await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        Usuario: {
          title: [{ text: { content: usuario } }],
        },
        'Fecha Pedido': {
          date: { start: new Date().toISOString() },
        },
        'Fecha del partido': {
          date: { start: fechaPartido },
        },
        'Hora Del Partido': {
          rich_text: [{ text: { content: horaPartido } }],
        },
        'Estado Pedido': {
          select: { name: 'Pendiente' },
        },
        Cancha: {
          select: { name: cancha },
        },
        Equipos: {
          rich_text: [{ text: { content: equipos } }],
        },
        Descripcion: {
          rich_text: [{ text: { content: descripcion } }],
        },
        'Número de Teléfono': {
          phone_number: telefono,
        },
      },
    });

    console.log('Pedido guardado en Notion correctamente.');

    // Enviar mensaje al usuario
    await whatsappClient.sendMessage(
      message.from,
      `${usuario}, tu partido en la cancha ${cancha} está en cola para las ${horaPartido}. Recibirás una notificación cuando esté listo. ⚽`
    );
    console.log('Mensaje de "en cola" enviado al usuario.');
  } catch (error) {
    console.error('Error al guardar en Notion o enviar mensaje:', error);
    await whatsappClient.sendMessage(
        message.from,
        `⚠ Error: No se pudo registrar tu pedido debido a un problema técnico. Por favor, inténtalo de nuevo más tarde.`
      );
      console.error('Error al registrar el pedido:', error);
    }
  });
  
  whatsappClient.initialize();
  
  whatsappClient.on('ready', () => {
    console.log('WhatsApp client is ready!');
  });
  
  // Servidor Express
  const PORT = 5000;
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
  