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
let userSessions = {};


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
            `🎉 ¡Tu partido en la cancha *${cancha}* está listo 
escriba *ok* para proceder con el pago. ⚽`
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
  

  // Inicializar la sesión del usuario si no existe
  if (!userSessions[telefono]) {
    userSessions[telefono] = {
      awaitingDetails: false,
      awaitingConfirmation: false,
      editField: '',
      partidoData: {
        fecha: '',
        hora: '',
        equipos: '',
        cancha: '',
        descripcion: ''
      }
    };
  }

  const session = userSessions[telefono];

  if (usersAwaitingResponse[telefono]) {
  // Mostrar el menú principal
  if (userMessage === 'menu') {
    await whatsappClient.sendMessage(
      message.from,
      `*Menú principal*\n\n` +
      `1️⃣ *Compra De Partido 📽️*\n` +
      `2️⃣ *Compra de Resumen y Clip 🎬*\n` +
      `3️⃣ *Combo Completo 📦*\n` +
      `4️⃣ *Precios 💸*\n\n` +
      `Por favor ingresa el número de la opción que deseas seleccionar.`
    );
    return;
  }

  // Opción 1: Compra de Partido
  if (userMessage === '1') {
    session.awaitingDetails = true;
    await whatsappClient.sendMessage(
      message.from,
      `Has seleccionado *Compra De Partido*. Por favor completa la siguiente información en el siguiente formato:\n\n` +
      `*Fecha del partido*: (Ej: Dia/Mes/Año)\n` +
      `*Hora del partido*: (Ej: 15:10 PM)\n` +
      `*Equipos del partido*: (Ej: Equipo1 vs Equipo2)\n` +
      `*Cancha*: (Ej: Nombre de la cancha)\n` +
      `*Descripción (Opcional)*: _Describe tu indumentaria_\n\n` +
      `Cuando termines, escribe *Ok* para continuar.`
    );
    return;
  }

  // Capturar detalles en un solo mensaje
  if (session.awaitingDetails && userMessage !== 'ok') {
    const lines = message.body.split('\n');
    session.partidoData = {
        fecha: lines[0]?.trim() || '',
        hora: lines[1]?.trim() || '',
        equipos: lines[2]?.trim() || '',
        cancha: lines[3]?.trim() || '',
        descripcion: lines[4]?.trim() || 'Sin descripción',
    };

    // Validar si los datos están completos
    const { fecha, hora, equipos, cancha } = session.partidoData;
    if (!fecha || !hora || !equipos || !cancha) {
        await whatsappClient.sendMessage(
            message.from,
            `⚠️ *Datos incompletos.* Por favor asegúrate de proporcionar:\n` +
            `- *Fecha del partido*\n` +
            `- *Hora del partido*\n` +
            `- *Equipos del partido*\n` +
            `- *Cancha*\n\n` +
            `Envía los datos nuevamente en el formato indicado.`
        );
        return;
    }

    // Si los datos están completos, permitir continuar
    await whatsappClient.sendMessage(
        message.from,
        `✅ Datos recibidos correctamente. Escribe *Ok* para confirmar o vuelve a enviar los datos si necesitas corregirlos.`
    );
    return;
}


  // Validar datos al recibir "Ok"
  if (session.awaitingDetails && userMessage === 'ok') {
    const { fecha, hora, equipos, cancha } = session.partidoData;

    if (!fecha || !hora || !equipos || !cancha) {
      await whatsappClient.sendMessage(
        message.from,
        `⚠️ Datos incompletos. Por favor asegúrate de proporcionar:\n` +
        `- *Fecha del partido*\n` +
        `- *Hora del partido*\n` +
        `- *Equipos del partido*\n` +
        `- *Cancha*\n\n` +
        `Vuelve a enviar los datos correctamente.`
      );
      return;
    }

    // Confirmación de datos completos
    await whatsappClient.sendMessage(
      message.from,
      `🎉 ¡Datos completos! Aquí tienes la información proporcionada:\n\n` +
      `*Fecha*: ${fecha}\n` +
      `*Hora*: ${hora}\n` +
      `*Equipos*: ${equipos}\n` +
      `*Cancha*: ${cancha}\n` +
      `*Descripción*: ${session.partidoData.descripcion}\n\n` +
      `¿Los datos son correctos?\n9️⃣ *Confirmar*.`
    );

    session.awaitingDetails = false;
    session.awaitingConfirmation = true;
    return;
  }else{
    // Confirmación o edición
// Función para convertir una fecha al formato ISO 8601
function formatDateToISO(dateString) {
  const [day, month, year] = dateString.split('/');
  return `${year}-${month}-${day}`;
}

// Dentro de la confirmación de datos:
if (session.awaitingConfirmation) {
  if (userMessage === '9') { // Manejar confirmación
    try {
      // Convertir la fecha al formato ISO 8601
      const formattedDate = formatDateToISO(session.partidoData.fecha);

      // Guardar los datos en Notion
      await notion.pages.create({
        parent: { database_id: databaseId },
        properties: {
          Usuario: { title: [{ text: { content: 'Userchat' } }] }, // Usuario fijo
          'Fecha Pedido': { date: { start: new Date().toISOString() } }, // Fecha y hora actuales
          'Fecha del partido': { date: { start: formattedDate } }, // Fecha formateada
          'Hora Del Partido': { rich_text: [{ text: { content: session.partidoData.hora } }] },
          'Estado Pedido': { select: { name: 'Pendiente' } }, // Estado definido
          'Cancha': { select: { name: session.partidoData.cancha } },
          'Equipos': { rich_text: [{ text: { content: session.partidoData.equipos } }] },
          'Descripcion': { rich_text: [{ text: { content: session.partidoData.descripcion } }] },
          'Número de Teléfono': { phone_number: telefono }, // Teléfono del usuario
        },
      });

      // Confirmación de guardado al usuario
      await whatsappClient.sendMessage(
        message.from,
        '✅ ¡Datos guardados en Notion correctamente! Gracias por usar nuestro servicio.'
      );

      // Finalizar la sesión del usuario
      delete userSessions[telefono];
    } catch (error) {
      console.error('Error al guardar en Notion:', error);

      // Notificar error al usuario
      await whatsappClient.sendMessage(
        message.from,
        '⚠️ Ocurrió un error al guardar el partido. Inténtalo nuevamente más tarde.'
      );
    }
    return;
  }
}


  }

  // Confirmación o edición
  if (session.awaitingConfirmation) {
    if (userMessage === '2') {
      try {
        await notion.pages.create({
          parent: { database_id: databaseId },
          properties: {
            Usuario: { title: [{ text: { content: telefono } }] },
            'Fecha del partido': { date: { start: session.partidoData.fecha } },
            'Hora Del Partido': { rich_text: [{ text: { content: session.partidoData.hora } }] },
            Equipos: { rich_text: [{ text: { content: session.partidoData.equipos } }] },
            Cancha: { select: { name: session.partidoData.cancha } },
            Descripcion: { rich_text: [{ text: { content: session.partidoData.descripcion } }] },
          },
        });

        await whatsappClient.sendMessage(
          message.from,
          '✅ ¡Partido registrado correctamente! Gracias por usar nuestro servicio.'
        );
        delete userSessions[telefono]; // Finaliza la sesión
      } catch (error) {
        console.error('Error al guardar en Notion:', error);
        await whatsappClient.sendMessage(
          message.from,
          '⚠️ Hubo un error al guardar el partido. Inténtalo de nuevo.'
        );
      }
    }
    return;
  }

    // Lógica para manejar respuesta de "¿Desea continuar?"
    if (userMessage === 'sí' || userMessage === 'si') {
        await whatsappClient.sendMessage(
            message.from,
            `*Menú principal:*\n
1️⃣ *Compra De Partido. 📽️*\n
2️⃣ *Compra de Resumen y Clip. 🎬*\n
3️⃣ *Combo Completo. 📦*\n 
4️⃣ *Precio.s 💸* \n\n
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
              `Bienvenido usuario: *${usuarioNombre}*`
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

  if (userMessage === 'nuevo pedido') {
    try {
      // Consultar si el usuario está registrado en Notion
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
        // Enviar el menú principal si el usuario está registrado
        await whatsappClient.sendMessage(
          message.from,
          `*Menú principal*\n
1️⃣ *Compra De Partido. 📽️*\n
2️⃣ *Compra de Resumen y Clip. 🎬*\n
3️⃣ *Combo Completo. 📦*\n 
4️⃣ *Precios. 💸* \n\n
  Por favor ingresa el número de la opción que deseas seleccionar.`
        );
        console.log(`Menú principal enviado a ${telefono}.`);
      } else {
        // Respuesta para usuarios no registrados
        await whatsappClient.sendMessage(
          message.from,
          `⚠️ Lo sentimos, no encontramos tu registro. Por favor, regístrate primero para realizar un pedido.`
        );
        console.log(`Usuario no registrado: ${telefono}`);
      }
    } catch (error) {
      console.error('Error al verificar usuario en Notion:', error);
      await whatsappClient.sendMessage(
        message.from,
        `⚠️ Ocurrió un error al procesar tu solicitud. Inténtalo nuevamente más tarde.`
      );
    }
    return;
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
      `*${usuario}*, Su partido en la cancha *${cancha}* A las *${horaPartido}* está en curso. ⌛, en el transcurso de el dia se le notifara el estado de su Partido \n
*IMPORTANTE:*
Para Hacer un nuevo pedido por favor escriba *Nuevo Pedido*🤖📦
      `
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
