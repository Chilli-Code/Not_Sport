const express = require('express');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');
const { Client: NotionClient } = require('@notionhq/client');
const qrcode = require('qrcode-terminal');

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

// Evento para mostrar el QR
whatsappClient.on('qr', (qr) => {
  console.log('Escanea este código QR para iniciar sesión con WhatsApp:');
  qrcode.generate(qr, { small: true });
});

// Evento cuando la sesión está lista
whatsappClient.on('ready', () => {
  console.log('WhatsApp client is ready!');
});

// Evento para capturar errores de autenticación
whatsappClient.on('auth_failure', (msg) => {
  console.error('Error de autenticación', msg);
});

// Almacenar estados previos, recordatorios activos y usuarios en espera de correo electrónico
let previousStates = {};
let activeReminders = {};
let awaitingEmail = {};
let usersAwaitingResponse = {};

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

      if (previousStates[pageId] !== estado && estado === 'Listo') {
        console.log(`Pedido ${pageId} está ahora "Listo". Enviando notificación...`);

        if (telefono) {
          await whatsappClient.sendMessage(
            `${telefono}@c.us`,
            `🎉 ¡Tu partido en la cancha ${cancha} está listo para las ${horaPartido}! Escribe *Ok* para proceder con el pago. ⚽`
          );
          console.log(`Mensaje enviado a ${telefono}`);

          if (!activeReminders[pageId]) {
            activeReminders[pageId] = setInterval(async () => {
              console.log(`Recordatorio para pedido ${pageId}`);
              await whatsappClient.sendMessage(
                `${telefono}@c.us`,
                `⏰ Recordatorio: ¡Tu partido en la cancha ${cancha} está listo! Responde con *Ok* para proceder con el pago.`
              );
            }, 3600000); // 1 hora
          }
        }
      }
      previousStates[pageId] = estado;
    }
  } catch (error) {
    console.error('Error al revisar estados en Notion:', error);
  }
};

setInterval(checkForUpdates, 60000);

// Manejar mensajes entrantes
whatsappClient.on('message', async (message) => {
  console.log('Mensaje recibido (en bruto):', message.body);

  const telefono = message.from.replace('@c.us', '');
  const userMessage = message.body.trim().toLowerCase();
  
  if (usersAwaitingResponse[telefono]) {
    if (usersAwaitingResponse[telefono] === 'menu') {
        // Lógica para manejar selección del menú principal
        switch (userMessage.trim()) {
            case '1':
            case '2':
            case '3':
                await whatsappClient.sendMessage(
                    message.from,
                    `Has seleccionado la opción ${userMessage}. Por favor, espera mientras procesamos tu solicitud.`
                );
                console.log(`Opción ${userMessage} seleccionada por el usuario.`);
                break;
            case '4': // Manejar la opción de precios
                await whatsappClient.sendMessage(
                    message.from,
                    `✅ *Descargar Partido*🏟️: _20.000💵_ \n` +
                    `✅ *Resumen Del Partido*: _12.000💵_ \n\n` +
                    `✅ *Clips Personalizados*: \n\n` +
                    `⚫ _Clip Corto:_ *5.000💵* Para aquellos momentos breves y destacados, ideal para jugadas individuales o goles.\n\n` +
                    `⚫ _Clip Largo:_ *10.000💵* Para secuencias más detalladas o análisis completos.`
                );
                console.log('Menú de precios enviado.');
                break;
            default:
                await whatsappClient.sendMessage(
                    message.from,
                    `⚠️ Opción no válida. Por favor, selecciona un número del menú.`
                );
                console.log('Opción no válida seleccionada.');
                return;
        }
        delete usersAwaitingResponse[telefono]; // Eliminar el estado después de procesar la selección
        return;
    }

    // Lógica para manejar respuesta de "¿Desea continuar?"
    if (userMessage === 'sí' || userMessage === 'si') {
        await whatsappClient.sendMessage(
            message.from,
            `*Menú principal*\n
            1️⃣ *Compra De Partido 📽️*.\n
            2️⃣ *Compra de Resumen y Clip 🎬*.\n
            3️⃣ *Combo Completo 📦*.\n 
            4️⃣ *Precios 💸* \n\n
            Por favor ingresa el número de la opción que deseas seleccionar.`
        );
        usersAwaitingResponse[telefono] = 'menu'; // Cambiar el estado a "menu"
    } else {
        await whatsappClient.sendMessage(message.from, 'Gracias por tu tiempo. ¡Hasta luego!');
        delete usersAwaitingResponse[telefono]; // Eliminar al usuario de la lista de espera si no desea continuar
    }
    return;
}



// Lógica para manejar selección de opciones en el menú principal
if (usersAwaitingResponse[telefono] === 'menu') {
  switch (userMessage.trim()) {
      case '1':
      case '2':
      case '3':
          await whatsappClient.sendMessage(
              message.from,
              `Has seleccionado la opción ${userMessage}. Por favor, espera mientras procesamos tu solicitud.`
          );
          console.log(`Opción ${userMessage} seleccionada por el usuario.`);
          break;
      case '4': // Manejar la opción de precios
          await whatsappClient.sendMessage(
              message.from,
              `✅ *Descargar Partido*🏟️: _20.000💵_ \n` +
              `✅ *Resumen Del Partido*: _12.000💵_ \n\n` +
              `✅ *Clips Personalizados*: \n\n` +
              `⚫ _Clip Corto:_ *5.000💵* Para aquellos momentos breves y destacados, ideal para jugadas individuales o goles.\n\n` +
              `⚫ _Clip Largo:_ *10.000💵* Para secuencias más detalladas o análisis completos.`
          );
          console.log('Menú de precios enviado.');
          break;
      default:
          await whatsappClient.sendMessage(
              message.from,
              `⚠️ Opción no válida. Por favor, selecciona un número del menú.`
          );
          console.log('Opción no válida seleccionada.');
          return;
  }
  delete usersAwaitingResponse[telefono]; // Eliminar al usuario de la lista de espera después de procesar su selección
  return;
}

  
  if (userMessage && userMessage !== 'ok' && !awaitingEmail[telefono]) {
    try {
      const response = await notion.databases.query({
          database_id: databaseId,
          filter: {
              property: 'Número de Teléfono',
              phone_number: {
                  equals: telefono,
              },
          },
      });

        const usuarioRegistrado = response.results.length > 0;

        if (usuarioRegistrado) {
          // Usuario registrado: Enviar mensaje de bienvenida
          const usuarioNombre = response.results[0].properties['Usuario']?.title?.[0]?.text?.content || 'Usuario';
          await whatsappClient.sendMessage(
              message.from,
              `Bienvenido usuario: ${usuarioNombre}`
          );
          console.log(`Mensaje de bienvenida enviado a ${telefono} con el nombre de usuario: ${usuarioNombre}`);
      } else {
          // Validar si el mensaje viene de la web
          if (!userMessage.startsWith("web:")) { // Cambia esta lógica según cómo identifiques los mensajes de la web
              await whatsappClient.sendMessage(
                  message.from,
                  'Buenas tardes, queremos informarles que no somos Baloa. ¿Desea continuar? Responda con "Sí" o "No".'
              );
              usersAwaitingResponse[telefono] = true; // Agregar usuario a la lista de espera
              console.log(`Mensaje de "no somos Baloa" enviado a ${telefono}.`);
          } else {
              console.log('Mensaje recibido desde la web, ignorando lógica de "no somos Baloa".');
          }
      }
  } catch (error) {
      console.error('Error al verificar usuario en Notion:', error);
  }
}

  if (awaitingEmail[telefono]) {
    awaitingEmail[telefono] = false;
    await whatsappClient.sendMessage(
      message.from,
      `✅ Gracias por compartir tu correo electrónico. Te enviaremos el enlace de tu partido pronto. 📧`
    );
    console.log(`Correo registrado para el usuario ${telefono}: ${message.body}`);
    return;
  }

  if (userMessage === 'ok') {
    for (const [pageId, reminder] of Object.entries(activeReminders)) {
      const response = await notion.pages.retrieve({ page_id: pageId });
      const userPhone = response.properties['Número de Teléfono']?.phone_number;

      if (userPhone === telefono) {
        console.log(`Respuesta "Ok" recibida del usuario ${telefono} para el pedido ${pageId}.`);

        clearInterval(reminder);
        delete activeReminders[pageId];

        const paymentLink = 'https://checkout.bold.co/payment/LNK_PJUJJLEW6Q';
        await whatsappClient.sendMessage(
          message.from,
          `🔗 ¡Gracias! Aquí está el enlace para realizar el pago:
${paymentLink}`
        );

        awaitingEmail[telefono] = true;
        await whatsappClient.sendMessage(
          message.from,
          `📧 ¿Nos puedes compartir tu correo electrónico para enviarte el enlace de tu partido?`
        );

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

  let fechaPartido = null;
  if (fechaPartidoOriginal) {
    const [day, month, year] = fechaPartidoOriginal.split('-');
    fechaPartido = `${year}-${month}-${day}`;
  }

  if (!fechaPartido || horaPartido === 'Desconocida') {
    console.log(
      `Advertencia: No se puede registrar el pedido. Fecha: ${fechaPartidoOriginal}, Hora: ${horaPartido}`
    );
    return;
  }

  try {
    console.log('Intentando guardar el pedido en Notion...');
    await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        Usuario: { title: [{ text: { content: usuario } }] },
        'Fecha Pedido': { date: { start: new Date().toISOString() } },
        'Fecha del partido': { date: { start: fechaPartido } },
        'Hora Del Partido': { rich_text: [{ text: { content: horaPartido } }] },
        'Estado Pedido': { select: { name: 'Pendiente' } },
        Cancha: { select: { name: cancha } },
        Equipos: { rich_text: [{ text: { content: equipos } }] },
        Descripcion: { rich_text: [{ text: { content: descripcion } }] },
        'Número de Teléfono': { phone_number: telefono },
      },
    });

    console.log('Pedido guardado en Notion correctamente.');
    await whatsappClient.sendMessage(
      message.from,
      `${usuario}, tu partido en la cancha ${cancha} está en cola para las ${horaPartido}.`
    );
  } catch (error) {
    console.error('Error al guardar en Notion o enviar mensaje:', error);
  }
});

whatsappClient.initialize();

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
