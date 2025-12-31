import {Maker} from 'imagemaker.js';

const handler = async (m, {conn, args, command, usedPrefix}) => {
  const text = args.join(' ');
  
  const mostrarMenu = async () => {
    const menuImage = 'https://speed3xz.bot.nu/storage/img/IMG_5765.jpeg';
    const txt = `
*🎨 LOGO MENU - SPEED3XZ 🎨*

*ꕤ Uso:* ${usedPrefix}<comando> <texto>
*ꕤ Ejemplo:* ${usedPrefix}logoneon Speed3xz

*📱 Logos Básicos:*
• ${usedPrefix}logocorazon <texto>
• ${usedPrefix}logochristmas <texto>
• ${usedPrefix}logopareja <texto>
• ${usedPrefix}logoglitch <texto>
• ${usedPrefix}logosad <texto>
• ${usedPrefix}logoneon <texto>
• ${usedPrefix}logonube <texto>
• ${usedPrefix}logoangel <texto>

*🎮 Logos Gaming:*
• ${usedPrefix}logogaming <texto>
• ${usedPrefix}logodragonball <texto>
• ${usedPrefix}logolol <texto>
• ${usedPrefix}logoamongus <texto>
• ${usedPrefix}logopubg <texto>
• ${usedPrefix}logoarmy <texto>
• ${usedPrefix}logocounter <texto>
• ${usedPrefix}logofortnite <texto>

*⛩️ Logos Anime:*
• ${usedPrefix}logonaruto <texto>
• ${usedPrefix}logoone <texto>
• ${usedPrefix}logoboku <texto>
• ${usedPrefix}logokimetsu <texto>

*✨ Logos 3D/Estilo:*
• ${usedPrefix}logograffiti3d <texto>
• ${usedPrefix}logomatrix <texto>
• ${usedPrefix}logofuturista <texto>
• ${usedPrefix}logometal <texto>
• ${usedPrefix}logoneon2 <texto>

*🎥 Logos de Video:*
• ${usedPrefix}logovideopubg <texto>
• ${usedPrefix}logovideotiger <texto>
• ${usedPrefix}logovideointro <texto>
• ${usedPrefix}logovideogaming <texto>

*🖼️ Logos de Portadas:*
• ${usedPrefix}logoportadaff <texto>
• ${usedPrefix}logoportadapubg <texto>
• ${usedPrefix}logoportadaplayer <texto>
• ${usedPrefix}logoportadayoutube <texto>

*📌 Total de logos disponibles: 50+*
*💡 Usa cualquier comando con tu texto*

*【 ✰ 】𝗦𝗽𝗲𝗲𝗱𝟯𝘅𝘇 𝗖𝗹𝘂𝗯 - 𝗢𝗳𝗶𝗰𝗶𝗮𝗹*
`;

    try {
      await conn.sendMessage(m.chat, {
        image: { url: menuImage },
        caption: txt,
        contextInfo: {
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '120363403176894973@newsletter',
            serverMessageId: '',
            newsletterName: '【 ✰ 】𝗦𝗽𝗲𝗲𝗱𝟯𝘅𝘇 𝗖𝗹𝘂𝗯 - 𝗢𝗳𝗶𝗰𝗶𝗮𝗹 𝗖𝗵𝗮𝗻𝗻𝗲𝗹'
          }
        }
      }, { quoted: m });
    } catch (e) {
      await conn.sendMessage(m.chat, {
        text: `❌ Error en el menú:\n${e}`
      }, { quoted: m });
    }
  };

  // COMANDOS DE MENÚ - Deben coincidir EXACTAMENTE con handler.command
  if (command === 'logo' || command === 'logos' || command === 'logomenu' || command === 'menulogos' || command === 'menulogo') {
    await mostrarMenu();
    return;
  }

  // Para los comandos de logos específicos
  const logoCommands = {
    'logocorazon': '/text-heart-flashlight-188.html',
    'logochristmas': '/christmas-effect-by-name-376.html',
    'logopareja': '/sunlight-shadow-text-204.html',
    'logoglitch': '/create-digital-glitch-text-effects-online-767.html',
    'logosad': '/write-text-on-wet-glass-online-589.html',
    'logogaming': '/make-team-logo-online-free-432.html',
    'logosolitario': '/create-typography-text-effect-on-pavement-online-774.html',
    'logodragonball': '/create-dragon-ball-style-text-effects-online-809.html',
    'logoneon': '/create-impressive-neon-glitch-text-effects-online-768.html',
    'logogatito': '/handwritten-text-on-foggy-glass-online-680.html',
    'logochicagamer': '/create-cute-girl-gamer-mascot-logo-online-687.html',
    'logonaruto': '/naruto-shippuden-logo-style-text-effect-online-808.html',
    'logofuturista': '/light-text-effect-futuristic-technology-style-648.html',
    'logonube': '/cloud-text-effect-139.html',
    'logoangel': '/angel-wing-effect-329.html',
    'logocielo': '/create-a-cloud-text-effect-in-the-sky-618.html',
    'logograffiti3d': '/text-graffiti-3d-208.html',
    'logomatrix': '/matrix-text-effect-154.html',
    'logohorror': '/blood-writing-text-online-77.html',
    'logoalas': '/the-effect-of-galaxy-angel-wings-289.html',
    'logoarmy': '/free-gaming-logo-maker-for-fps-game-team-546.html',
    'logopubg': '/pubg-logo-maker-cute-character-online-617.html',
    'logopubgfem': '/pubg-mascot-logo-maker-for-an-esports-team-612.html',
    'logolol': '/make-your-own-league-of-legends-wallpaper-full-hd-442.html',
    'logoamongus': '/create-a-cover-image-for-the-game-among-us-online-762.html',
    'logovideopubg': '/lightning-pubg-video-logo-maker-online-615.html',
    'logovideotiger': '/create-digital-tiger-logo-video-effect-723.html',
    'logovideointro': '/free-logo-intro-video-maker-online-558.html',
    'logovideogaming': '/create-elegant-rotation-logo-online-586.html',
    'logoguerrero': '/create-project-yasuo-logo-384.html',
    'logoportadaplayer': '/create-the-cover-game-playerunknown-s-battlegrounds-401.html',
    'logoportadaff': '/create-free-fire-facebook-cover-online-567.html',
    'logoportadapubg': '/create-facebook-game-pubg-cover-photo-407.html',
    'logoportadacounter': '/create-youtube-banner-game-cs-go-online-403.html',
    'logoneon2': '/create-3d-neon-light-text-effects-online-759.html',
    'logometal': '/create-steel-text-effect-free-online-802.html',
    'logocircuit': '/create-circuit-text-effect-online-795.html',
    'logoglitch2': '/create-glitch-text-effects-tiktok-online-796.html',
    'logodemon': '/demon-slayer-text-effect-online-811.html',
    'logoone': '/one-punch-man-logo-style-text-effect-online-807.html',
    'logoboku': '/my-hero-academia-logo-style-text-effect-online-806.html',
    'logokimetsu': '/kimetsu-no-yaiba-logo-style-text-effect-online-810.html',
    'logoharry': '/harry-potter-logo-style-text-effect-online-813.html',
    'logomarvel': '/marvel-studios-logo-style-text-effect-online-814.html',
    'logocandy': '/write-text-in-candy-online-292.html',
    'logofire': '/create-burning-text-effect-online-220.html',
    'logoice': '/create-ice-text-effect-online-187.html',
    'logogold': '/golden-text-effect-online-163.html',
    'logosilver': '/silver-text-effect-online-162.html',
    'logosparkle': '/sparkle-text-effect-147.html',
    'logorainbow': '/rainbow-text-effect-online-161.html',
    'logoshadow': '/shadow-text-effect-150.html',
    'logogradient': '/gradient-text-effect-148.html',
    'logowater': '/water-text-effect-151.html',
    'logostone': '/stone-text-effect-155.html',
    'logowood': '/wood-text-effect-152.html',
    'logofortnite': '/fortnite-logo-maker-online-605.html',
    'logocounter': '/cs-go-logo-maker-online-608.html',
    'logominecraft': '/minecraft-logo-maker-online-610.html',
    'logoroblox': '/roblox-logo-maker-online-609.html',
    'logovalorant': '/valorant-logo-maker-online-604.html',
    'logoportadayoutube': '/create-youtube-banner-online-414.html',
    'logoportadainstagram': '/create-instagram-story-online-415.html',
    'logoportadawhatsapp': '/create-whatsapp-status-online-416.html',
    'logoportadafacebook': '/create-facebook-cover-online-417.html',
    'logoflor': '/flower-text-effect-175.html',
    'logocorazones': '/heart-text-effect-176.html',
    'logoestrellas': '/star-text-effect-177.html',
    'logoluna': '/moon-text-effect-178.html',
    'logosol': '/sun-text-effect-179.html'
  };

  // Verificar si es un comando de logo válido
  if (logoCommands[command]) {
    // Si no hay texto, mostrar error específico
    if (!text) {
      return await conn.reply(m.chat, `*ꕤ Ingrese un texto para el logo.*\n*Ejemplo:* ${usedPrefix + command} Speed3xz`, m);
    }
    
    // Crear el logo
    try {
      await conn.reply(m.chat, '*ꕤ Creando logo...*', m);
      
      const ephotoApi = global.APIs.ephoto360;
      if (!ephotoApi || !ephotoApi.url) {
        throw new Error('API ephoto360 no configurada');
      }
      
      const fullUrl = ephotoApi.url + logoCommands[command];
      const res = await new Maker().Ephoto360(fullUrl, [text]);
      
      await conn.sendFile(m.chat, res.imageUrl, 'logo.jpg', `✅ Logo creado con éxito\n📝 Texto: ${text}`, m);
    } catch (error) {
      console.error('Error en comando de logo:', error);
      await conn.reply(m.chat, `*ꕤ Error al crear el logo.*\n*Posibles causas:*\n• API no disponible\n• Ruta incorrecta\n• Límite de uso\n\n*Comando:* ${command}\n*Ruta:* ${logoCommands[command] || 'No encontrada'}`, m);
    }
  }
}

handler.help = [
  'logo', 'logos', 'logomenu', 'menulogos', 'menulogo',
  'logocorazon', 'logochristmas', 'logopareja', 'logoglitch', 'logosad', 
  'logogaming', 'logosolitario', 'logodragonball', 'logoneon', 'logogatito', 
  'logochicagamer', 'logonaruto', 'logofuturista', 'logonube', 'logoangel', 
  'logocielo', 'logograffiti3d', 'logomatrix', 'logohorror', 'logoalas', 
  'logoarmy', 'logopubg', 'logopubgfem', 'logolol', 'logoamongus', 
  'logovideopubg', 'logovideotiger', 'logovideointro', 'logovideogaming', 
  'logoguerrero', 'logoportadaplayer', 'logoportadaff', 'logoportadapubg', 
  'logoportadacounter', 'logodemon', 'logoone', 'logoboku', 'logokimetsu',
  'logoneon2', 'logometal', 'logofortnite', 'logocounter'
]

handler.tags = ['logos']

handler.command = [
  // Comandos de menú (EXACTAMENTE como se usarán)
  'logo', 
  'logos', 
  'logomenu', 
  'menulogos', 
  'menulogo',
  
  // Comandos de logos específicos
  'logocorazon', 
  'logochristmas', 
  'logopareja', 
  'logoglitch', 
  'logosad', 
  'logogaming', 
  'logosolitario', 
  'logodragonball', 
  'logoneon', 
  'logogatito', 
  'logochicagamer', 
  'logonaruto', 
  'logofuturista', 
  'logonube', 
  'logoangel', 
  'logocielo', 
  'logograffiti3d', 
  'logomatrix', 
  'logohorror', 
  'logoalas', 
  'logoarmy', 
  'logopubg', 
  'logopubgfem', 
  'logolol', 
  'logoamongus', 
  'logovideopubg', 
  'logovideotiger', 
  'logovideointro', 
  'logovideogaming', 
  'logoguerrero', 
  'logoportadaplayer', 
  'logoportadaff', 
  'logoportadapubg', 
  'logoportadacounter',
  'logodemon',
  'logoone',
  'logoboku',
  'logokimetsu',
  'logoneon2',
  'logometal',
  'logofortnite',
  'logocounter'
]

export default handler;