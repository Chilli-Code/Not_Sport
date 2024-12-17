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
whatsappClient.on('disconnected', (reason) => {
  console.log('Cliente desconectado:', reason);
  console.log('Por favor, vuelve a ejecutar la aplicación.');
});
let botNumber;

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
            `🎉¡Ajá, brother! Tu partido en la cancha *${cancha}* ya está listo pa' la acción. ⚽

🤖 Soy *Clippy* y te aviso que llegó la hora de darle play. ✍ Escribe *"Pago"* pa' seguir la vuelta y cuadrar el pago. 💵⚽`
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

function formatDateToISO(dateString) {
  const [day, month, year] = dateString.split('/');
  return `${year}-${month}-${day}`;
}

// Manejar mensajes entrantes
whatsappClient.on('message', async (message) => {
  console.log('Mensaje recibido (en bruto):', message.body);

  const telefono = message.from.replace('@c.us', '');
  const userMessage = message.body.trim().toLowerCase();
  
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



  // Priorizar "pago" antes de cualquier otra lógica
  if (userMessage === 'pago') {
    for (const [pageId, reminder] of Object.entries(activeReminders)) {
      const response = await notion.pages.retrieve({ page_id: pageId });
      const userPhone = response.properties['Número de Teléfono']?.phone_number;

      if (userPhone === telefono) {
        console.log(`Respuesta "Pago" recibida del usuario ${telefono} para el pedido ${pageId}.`);

        clearInterval(reminder);
        delete activeReminders[pageId];

        const paymentLink = 'https://checkout.bold.co/payment/LNK_PJUJJLEW6Q';
        await whatsappClient.sendMessage(
          message.from,
          `🔗 ¡Gracias! Aquí está el enlace para realizar el pago:\n${paymentLink}\n\n` +
          `Vas a pagar $20.000 COP a NotBaloa. Confirma que el método de pago que elijas:
💸 Tenga dinero disponible.
✅ No esté bloqueado ni restringido.
🛍 Esté habilitado para compras internacionales si tu tarjeta no es Colombiana.
👌 Tenga topes que le permitan pagar el valor de tu compra`
        );

        awaitingEmail[telefono] = true;
        await whatsappClient.sendMessage(
          message.from,
          `📧 *Clippy🤖* Que Hay Brother!! ya casi terminamos en enviame tu *Correo de Gmail para compartirte el partido 🏟*`
        );

        await notion.pages.update({
          page_id: pageId,
          properties: {
            'Estado Pedido': { select: { name: 'Procesando Pago' } },
          },
        });

        console.log(`Estado del pedido ${pageId} actualizado a "Procesando Pago".`);
        return;
      }
    }
    return;
  }


  // Inicializar la sesión del usuario si no existe
  if (!userSessions[telefono]) {
    userSessions[telefono] = {
      awaitingDetails: false,
      awaitingConfirmation: false,
      hasGreeted: false,
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
  if (!userSessions[telefono]) {
    userSessions[telefono] = {
      awaitingUsername: false,
      pageId: null, // Guardar el page_id de Notion
      partidoData: {},
    };
  }

  const session = userSessions[telefono];



  // Verificar si el usuario está registrado
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
 // Buscar usuario en Notion
 try {
  const response = await notion.databases.query({
    database_id: databaseId,
    filter: { property: 'Número de Teléfono', phone_number: { equals: telefono } },
  });

  if (response.results.length > 0) {
    session.pageId = response.results[0].id; // Guardar el page_id si existe
    session.username = response.results[0].properties['Usuario']?.title?.[0]?.text?.content || 'Usuario';
  }
} catch (error) {
  console.error('Error al verificar usuario en Notion:', error);
}

// Si el usuario no está registrado y escribe "si"
if (!session.pageId && userMessage === 'si' && !session.awaitingUsername) {
  session.awaitingUsername = true;
  await whatsappClient.sendMessage(message.from, 'Por favor, escribe tu nombre de usuario para continuar.');
  return;
}

// Capturar nombre de usuario y crear el registro en Notion
if (session.awaitingUsername && userMessage) {
  session.username = userMessage;

  // Crear una fila en Notion solo con el nombre y teléfono
  try {
    const newUser = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        Usuario: { title: [{ text: { content: userMessage } }] },
        'Número de Teléfono': { phone_number: telefono },
      },
    });
    session.pageId = newUser.id; // Guardar el page_id
    session.awaitingUsername = false;

    await whatsappClient.sendMessage(message.from, `¡Gracias, *${userMessage}*! Ahora puedes realizar tu pedido.`);
  } catch (error) {
    console.error('Error al crear usuario en Notion:', error);
    await whatsappClient.sendMessage(message.from, 'Ocurrió un error al registrar tu nombre. Inténtalo de nuevo.');
  }
  return;
}

    if (session.awaitingUsername && userMessage) {
      session.username = userMessage;
      session.awaitingUsername = false;
      
      // Guardar el usuario en Notion
      try {
        await notion.pages.create({
          parent: { database_id: databaseId },
          properties: {
            'Usuario': { title: [{ text: { content: userMessage } }] },
            'Número de Teléfono': { phone_number: telefono },
          },
        });
      } catch (error) {
        console.error('Error al guardar usuario en Notion:', error);
      }

      await whatsappClient.sendMessage(
        message.from,
        `Usuario: *${userMessage}*`
      );
      return;
    }

    if (usuarioRegistrado && !session.hasGreeted) {
      const usuarioNombre = response.results[0].properties['Usuario']?.title?.[0]?.text?.content || 'Usuario';
      await whatsappClient.sendMessage(
        message.from,
        `Bienvenido usuario: *${usuarioNombre}*`
      );
      console.log(`Mensaje de bienvenida enviado a ${telefono} con el nombre de usuario: ${usuarioNombre}`);
      session.hasGreeted = true; // Marcar como saludado
    }
    
    
  } catch (error) {
    console.error('Error al verificar usuario en Notion:', error);
  }


// Manejar el comando 'menu' en cualquier momento
if (userMessage === 'menu') {
  usersAwaitingResponse[telefono] = 'menu';
  await whatsappClient.sendMessage(
    message.from,
    `💬 ¡Hola! Soy *Clippy*🤖, tu asistente. ¡Listo para llevarte la emoción de cada partido! ⚽🔥\n\n` +
    `1️⃣ *Compra De Partido 📽️*\n` +
    `2️⃣ *Compra de Resumen y Clip 🎬*\n` +
    `3️⃣ *Combo Completo 📦*\n` +
    `4️⃣ *Precios 💸*\n\n` +
    `Por favor ingresa el número de la opción que deseas seleccionar.`
  );
  console.log(`Menú enviado a ${telefono}`);
  return;
}

// Lógica para manejar selección de opciones en el menú principal
if (usersAwaitingResponse[telefono] === 'menu') {
  switch (userMessage.trim()) {
    case '1':
      await whatsappClient.sendMessage(
        message.from,
        `¡Hey! Soy *Clippy*🤖.¡Vamos a dejar todo listo para tu partido! ⚽  
¡Veo que has elegido la Compra de Partido! 🏟 Ahora necesito que me des algunos detalles para tener todo bajo control🥅:\n\n` +

        `📅 *Fecha del partido* (Ej: 10/04/2024)\n` +
        `🕒 *Hora del partido* (Ej: 15:10 || _Hora Militar_)\n` +
        `⚽ *Equipos del partido* (Ej: Equipo1 vs Equipo2)\n` +
        `🏟  *Cancha* (Ej: Nombre de la cancha)\n` +
        `📝 *Descripción* (Opcional): Describe tu indumentaria\n\n`+
`📢 *Envíame los datos, cada uno en una línea, siguiendo este formato.*`
      );
      userSessions[telefono].awaitingDetails = true;
      usersAwaitingResponse[telefono] = null; // Limpiar el estado
      break;



    case '2':
    case '3':
      await whatsappClient.sendMessage(
        message.from,
        `Has seleccionado la opción ${userMessage}. Por favor, espera mientras procesamos tu solicitud.`
      );
      usersAwaitingResponse[telefono] = null; // Limpiar el estado
      break;
    case '4': // Manejar la opción de precios
      await whatsappClient.sendMessage(
        message.from,
        `¡Ajá, brother! Aquí te habla *Clippy*🤖, el pana que siempre está listo pa' darte la mano en la cancha 🤖⚽.Te cuento que estos son nuestros precios, pa' que te animes:\n\n` +
        `✅ *Descargar Partido*🏟️: _20.000💵_ \n` +
        `✅ *Resumen Del Partido*: _12.000💵_ \n` +
        `✅ *Clips Personalizados*: \n\n` +
        `⚫ _Clip Corto:_ *5.000💵* Para aquellos momentos breves y destacados, ideal para jugadas individuales o goles.\n\n` +
        `⚫ _Clip Largo:_ *10.000💵* Para secuencias más detalladas o análisis completos.\n\n`+
        `Entonces qué, mano? ¡Dime cuál te interesa y lo sacamos de una con Clippy!🌴🔥`
    );
      usersAwaitingResponse[telefono] = null; // Limpiar el estado
      break;
    default:
      await whatsappClient.sendMessage(
        message.from,
        `⚠️ Opción no válida. Por favor, selecciona un número del menú.`
      );
      break;
  }
  return;


  
}

// Capturar los datos del usuario después de que seleccionó "1"
if (session.awaitingDetails && userMessage !== 'ok') {
  const lines = message.body.split('\n').map((line) => line.trim());

  if (lines.length >= 4) { // Verificar que se hayan enviado los 4 campos requeridos
    session.partidoData.fecha = lines[0];
    session.partidoData.hora = lines[1];
    session.partidoData.equipos = lines[2];
    session.partidoData.cancha = lines[3];

    await whatsappClient.sendMessage(
      message.from,
      `🎉 ¡Oe, mano! Aquí te dejo la info que me pasaste, todo bien bacano: 🤖⚽* \n\n` +
      `📅 *Fecha:* ${session.partidoData.fecha}\n` +
      `⏰ *Hora:* ${session.partidoData.hora}\n` +
      `⚽ *Equipos:* ${session.partidoData.equipos}\n` +
      `🏟️ *Cancha:* ${session.partidoData.cancha}\n\n` +
    `¿Ta' to' bien o hay que corregir algo? 😏\n\n`+
      `✅ Escribe *Ok*  pa' dejarlo listo o escribe *Cancelar* si algo no cuadra.🔥
¿`
    );
  } else {
    await whatsappClient.sendMessage(
      message.from,
      `⚠ ¡Ey, bro! Soy *Clippy*🤖 y me hace falta algo de info para seguir con esto.
Mándame estos datos para que quede todo ready:👇 \n\n` +
      `📅 Fecha del partido\n` +
      `🕒 Hora del partido\n` +
      `⚽ Equipos del partido\n` +
      `🏟 Cancha\n\n` +
      `Mándame los datos así, cada uno en una línea. ¡Dale, bro, que esto se pone bueno!⚽🔥
`
    );
  }
  return;
}

// Confirmar los datos y guardar en Notion al recibir "ok"
if (session.awaitingDetails && userMessage === 'ok') {
  session.awaitingDetails = false; // Limpiar el estado

  try {
    // Buscar si el usuario ya existe en Notion
    const userResponse = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: 'Número de Teléfono',
        phone_number: { equals: telefono }
      }
    });

    if (userResponse.results.length === 0) {
      // Si el usuario no existe, crear una fila para su información inicial
      console.log("Usuario no encontrado. Creando una nueva fila de usuario.");
      const newUser = await notion.pages.create({
        parent: { database_id: databaseId },
        properties: {
          'Usuario': { title: [{ text: { content: session.username || 'Usuario desconocido' } }] },
          'Número de Teléfono': { phone_number: telefono }
        }
      });

      console.log(`Fila del usuario creada con ID: ${newUser.id}`);
    } else {
      console.log("El usuario ya existe. Creando una nueva fila de pedido.");
    }

    // Crear una nueva fila para el pedido (independientemente de si el usuario existe o no)
    await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        'Usuario': { title: [{ text: { content: session.username || 'Usuario desconocido' } }] },
        'Fecha del partido': { date: { start: formatDateToISO(session.partidoData.fecha) } },
        'Hora Del Partido': { rich_text: [{ text: { content: session.partidoData.hora } }] },
        Equipos: { rich_text: [{ text: { content: session.partidoData.equipos } }] },
        Cancha: { select: { name: session.partidoData.cancha } },
        'Fecha Pedido': { date: { start: new Date().toISOString() } },
        'Estado Pedido': { select: { name: 'Pendiente' } },
        'Número de Teléfono': { phone_number: telefono }
      }
    });

    console.log('Nuevo pedido guardado en Notion.');
    await whatsappClient.sendMessage(
      message.from,
      `✅ *¡Listo, Mano!* Yo mismo me encargué de guardar to' bien bacano. 🤖⚽
Tu partido en la cancha *${cancha}🏟️* ya está en *Estado: Pendiente* ⏳. Tranquilo, que durante el día te aviso cuando esté ready pa' que lo disfrutes. 🕒⚽\n\n`+
    
    `🔥Oye, bro, pásate por nuestra *Web* pa' que tus pedidos sean más rápidos y sin tanto enredo.¡Yo te lo recomiendo! 🌐
    
¡Gracias por confiar en mí, *Clippy!*🤖.Aquí siempre estoy firme pa' lo que necesites. 🔥`
    );

  } catch (error) {
    console.error('Error al registrar/actualizar pedido en Notion:', error);
    session.awaitingDetails = true; // Revertir el estado si ocurre un error
    await whatsappClient.sendMessage(
      message.from,
      `❌ Ocurrió un error al registrar tu pedido. Por favor, intenta nuevamente.`
    );
  }
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
              `¡Ajá, brother! Aquí te habla *Clippy*🤖, el pana que siempre está listo pa' darte la mano en la cancha 🤖⚽.
              Te cuento que estos son nuestros precios, pa' que te animes:\n\n` +
              `✅ *Descargar Partido*🏟️: _20.000💵_ \n` +
              `✅ *Resumen Del Partido*: _12.000💵_ \n` +
              `✅ *Clips Personalizados*: \n\n` +
              `⚫ _Clip Corto:_ *5.000💵* Para aquellos momentos breves y destacados, ideal para jugadas individuales o goles.\n\n` +
              `⚫ _Clip Largo:_ *10.000💵* Para secuencias más detalladas o análisis completos.\n\n`+
              `Entonces qué, mano? ¡Dime cuál te interesa y lo sacamos de una con Clippy!🌴🔥`
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
              // `Bienvenido usuario: *${usuarioNombre}*`
              `¡Hola, *${usuarioNombre}* Soy *Clippy*, tu asistente 🤖.¡Qué bacano tenerte por aquí! ⚽🌴
  
Te recuerdo que puedes escribirme *"Menu"* si necesitas pedir algo nuevo.
¡Estoy aquí pa’ ayudarte en lo que necesites! `
          );
          console.log(`Mensaje de bienvenida enviado a ${telefono} con el nombre de usuario: ${usuarioNombre}`);
      } else {
          // Validar si el mensaje viene de la web
          if (usersAwaitingResponse[telefono]) {
            if (userMessage === 'si') {
              delete usersAwaitingResponse[telefono]; // Limpiar el estado después de responder
              session.awaitingUsername = true; // Proceder a pedir el nombre de usuario
              await whatsappClient.sendMessage(
                message.from,
                'Por favor, escribe tu nombre de usuario para continuar.'
              );
              return;
            } else if (userMessage === 'no') {
              delete usersAwaitingResponse[telefono]; // Limpiar el estado
              await whatsappClient.sendMessage(
                message.from,
                'Gracias por tu respuesta. Si necesitas algo más, no dudes en escribirme.'
              );
              return;
            }
          } else if (!userMessage.startsWith("web:")) { // Si no hay estado de espera y no viene de la web
            usersAwaitingResponse[telefono] = true; // Marcar al usuario en espera de respuesta
            await whatsappClient.sendMessage(
              message.from,
              `📢 Buenas tardes,

📝 Quisiera comentarte un tema importante: las políticas de Baloa han cambiado 🚫 y ya no es posible descargar los resúmenes ni los clips personalizados directamente desde su plataforma.

✨ ¡Pero no te preocupes! Tenemos una solución para ti. ✨

💡 Es importante aclarar que NO formamos parte de Baloa, pero ofrecemos servicios adicionales que ellos no pueden cubrir. Entre ellos se encuentra:
📺 El partido completo, si lo deseas
🎞 Resúmenes personalizados
⚽ Clips destacados

Todo esto a un precio accesible 💰 para que no tengas ningún inconveniente.

❓¿Te gustaría hacer uso de alguno de nuestros servicios?
Responda con "Sí" o "No" 🤝
              `
            );
            console.log(`Mensaje de "no somos Baloa" enviado a ${telefono}.`);
          }
           else {
              console.log('Mensaje recibido desde la web, ignorando lógica de "no somos Baloa".');
          }
      }
  } catch (error) {
      console.error('Error al verificar usuario en Notion:', error);
  }
}


// Manejar el correo cuando el bot está esperando un correo
if (awaitingEmail[telefono]) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

  if (emailRegex.test(userMessage)) {
    // Correo válido
    const gmail = userMessage.trim();
    awaitingEmail[telefono] = false;

    try {
      // Buscar el pedido más reciente del usuario
      const response = await notion.databases.query({
        database_id: databaseId,
        filter: {
          property: 'Número de Teléfono',
          phone_number: { equals: telefono }
        }
      });

      if (response.results.length > 0) {
        const pageId = response.results[0].id;

        // Actualizar el campo Gmail en Notion
        await notion.pages.update({
          page_id: pageId,
          properties: {
            Gmail: { email: gmail }
          }
        });

        console.log(`Correo Gmail ${gmail} guardado en Notion.`);

        // Enviar mensaje de confirmación al usuario
        await whatsappClient.sendMessage(
          message.from,
          `✅ Gracias por compartir tu correo electrónico. Te enviaremos el enlace de tu partido pronto. 📧`
        );
        console.log(`Correo registrado para el usuario ${telefono}: ${gmail}`);
      } else {
        console.error('No se encontró un pedido asociado a este número de teléfono.');
      }

      // 💡 NUEVA LÓGICA: Envía enlace de Google Drive si existe
      const driveLinkRegex = /https:\/\/drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/;
      const driveLink = 'https://drive.google.com/file/d/13vCd-fado-ANhzEOJjuu-IGEaLA8L0OR/view?usp=drive_link'; // Simula el enlace

      const match = driveLink.match(driveLinkRegex);
      if (match) {
        const fileId = match[1]; // Extraer el ID del archivo
        const directLink = `https://drive.google.com/uc?id=${fileId}&export=download`;

        console.log(`Enlace detectado. ID del archivo: ${fileId}`);
        console.log(`Enlace directo de descarga: ${directLink}`);

        // Enviar el enlace directo al usuario
        await whatsappClient.sendMessage(
          message.from,
          `✅ *¡Listo!* 🎥\nTu archivo ahora está listo para descargar:\n` +
          `🔗 ${directLink}`
        );
      }

    } catch (error) {
      console.error('Error al guardar el correo en Notion:', error);
      await whatsappClient.sendMessage(
        message.from,
        '❌ Ocurrió un error al guardar tu correo. Por favor, intenta de nuevo.'
      );
    }
  } else {
    // Correo inválido
    await whatsappClient.sendMessage(
      message.from,
      '⚠️ El correo debe ser un *@gmail.com*. Por favor, envíalo nuevamente en el formato correcto.'
    );
  }
}

  

  

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
// Crear una nueva fila en Notion siempre
// Crear una nueva fila en Notion siempre
await notion.pages.create({
  parent: { database_id: databaseId },
  properties: {
    'Usuario': { title: [{ text: { content: session.username || 'Usuario desconocido' } }] },
    'Fecha del partido': { date: { start: formatDateToISO(session.partidoData.fecha) } },
    'Hora Del Partido': { rich_text: [{ text: { content: session.partidoData.hora } }] },
    Equipos: { rich_text: [{ text: { content: session.partidoData.equipos } }] },
    Cancha: { select: { name: session.partidoData.cancha } },
    'Fecha Pedido': { date: { start: new Date().toISOString() } },
    'Estado Pedido': { select: { name: 'Pendiente' } },
    'Número de Teléfono': { phone_number: telefono }
  }
});

console.log('Nuevo pedido guardado en Notion.');
await whatsappClient.sendMessage(
  message.from,
  `✅ *¡Listo, Mano!* Yo mismo me encargué de guardar to' bien bacano. 🤖⚽
Tu partido ya está en *estado: Pendiente* ⏳. Tranquilo, que durante el día te aviso cuando esté ready pa' que lo disfrutes. 🕒⚽\n\n`+

`🔥Oye, bro, pásate por nuestra *Web* pa' que tus pedidos sean más rápidos y sin tanto enredo.¡Yo te lo recomiendo! 🌐

¡Gracias por confiar en mí, *Clippy!*🤖.Aquí siempre estoy firme pa' lo que necesites. 🔥

`


);


console.log('Nuevo pedido guardado en Notion.');
await whatsappClient.sendMessage(
  message.from,
  `✅ *¡Todo listo!* Tu nuevo pedido ha sido registrado con éxito. ⚽`
);

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
