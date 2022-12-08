const dotEnv = require('dotenv').config()

const client_id="1016453555781107733";
const guild_id="1010754246469234698";
const styx_id="837834854636191745";
const premium_chan_id="1017525522634375228";
const pop_chan_id="1017620726087438376"//"1017619814627418112";
const member_id="1010754428367806464";
const premium_id="1015376694351253537";
const everyoneId="1010754246469234698";
const ticket_catagory="1017526067650629662";
const verify_chan_id="1010754424290955305";


const { Client, GatewayIntentBits, ApplicationCommandType, ApplicationCommandOptionType, PermissionFlagsBits, ChannelType  } = require('discord.js');
const DiscordJS = require('discord.js');
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages
    ] 
});

const { Captcha, CaptchaGenerator } = require('captcha-canvas');

var guild;

client.on('ready', () => {

    log(' Online ', `Connected to bot ${client.user.username}`);

    guild = client.guilds.cache.get(guild_id);

    client.user.setPresence({
        activities: [{ name: `for /verify!`, type: DiscordJS.ActivityType.Watching}],
        status: 'online',
      });

    setInterval(() => {
        client.user.setPresence({
            activities: [{ name: `for /verify!`, type: DiscordJS.ActivityType.Watching}],
            status: 'online',
        });

        var popChannel = guild.channels.cache.find(ch => ch.id == pop_chan_id);
        popChannel.setName(`Population: ${guild.memberCount}`);
    }, 120000);


    log(' Online ', `Loaded custom status`);
    client.application.commands.set([]);
    
    log('Register', `Removed old interaction commands`);


    var cmds;

    if (guild) {
        cmds = guild.commands;
    } else {
        cmds = client.application?.commands;
    }

    // cmds?.create({
    //     name: 'login',
    //     description: 'Gain access to the premium user only section.',
    //     type: ApplicationCommandType.String,
    //     options: [{
    //                 name: 'username',
    //                 description: 'Your nix username.',
    //                 required: true,
    //                 type: ApplicationCommandOptionType.String
    //             },
    //             {
    //                 name: 'password',
    //                 description: 'Your nix password.',
    //                 required: true,
    //                 type: ApplicationCommandOptionType.String
    //             }]
    // })
    // log('Register', `Added - login`);    

    cmds?.create({
        name: 'verify',
        description: 'Gain access to the free users section.',
    });
    log('Register', `Added - verify`);    

    cmds?.create({
        name: 'admin',
        description: 'Does admin command.',
    });
    log('Register', `Added - admin`);   

});

client.on('interactionCreate', async (interaction) => {

    if (interaction.isButton()) {
        if (interaction.customId === 'closeTicket') {
            if (interaction.channel.name == `ticket-${interaction.user.username.toLowerCase()}${interaction.user.discriminator}` || interaction.user.id == styx_id) {
                interaction.channel.delete()
                .catch(() => {
                    return interaction.reply({
                        content: `> \r\n> Ticket failed to close.\r\n> ‎`
                    });
                })
            }
            else {
                return interaction.reply({
                    content: `> \r\n> This is not your ticket.\r\n> ‎`
                });
            }
        }
    
        else if (interaction.channelId === premium_chan_id && interaction.customId === 'openTicket') {
    
            chanExists = guild.channels.cache.find(ch => ch.name == `ticket-${interaction.user.username.toLowerCase()}${interaction.user.discriminator}`)
            if (chanExists !== undefined) return interaction.reply({content: `> \r\n> You already have an **open ticket** - ${chanExists}.\r\n> ‎`, ephemeral: true})
    
            guild.channels.create({
                name: `ticket-${interaction.user.username.toLowerCase()}${interaction.user.discriminator}`,
                type: ChannelType.GuildText,
                parent: ticket_catagory,
                permissionOverwrites: [
                    {
                        id: everyoneId,
                        deny: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: interaction.user.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                    }
                  ]
    
            })
            .then((chan) => {
   
                const row = new DiscordJS.ActionRowBuilder()
                .addComponents(
                    new DiscordJS.ButtonBuilder()
                        .setCustomId('closeTicket')
                        .setLabel('Close Ticket')
                        .setStyle(DiscordJS.ButtonStyle.Primary)   
                )
    
                interaction.reply({
                    content: `> \r\n> Ticket created ${chan}.\r\n> ‎`,
                    ephemeral: true
                });
    
                chan.send({components: [row], content: `Welcome ${interaction.member},\r\n> \r\n> To access the premium only discord, please use the \`/login\` command in **this** channel.\r\n> To close this ticket, press the button below!`})
            })
        }

        return;
    }

  if (!interaction.isCommand()) return;

  const { commandName, options, user } = interaction;

  const premiumRole = guild.roles.cache.find(role => role.id == premium_id);
  const memberRole = guild.roles.cache.find(role => role.id == member_id);

  if (commandName === 'verify') {
    if (interaction.channelId !== verify_chan_id) return interaction.reply({
        content: '> \r\n> You are already verified.\r\n> ‎',
        ephemeral: true
    });

    const captcha = new CaptchaGenerator()
    .setDimension(150, 450) 
    .setDecoy({total: 15, opacity: 0.7, size: 35})
    .setCaptcha({size: 60, color: "#7875ff"})
    .setTrace({color: '#7875ff'})

    const buffer = captcha.generateSync();

    interaction.reply({
        content: '> \r\n> Re-type the captcha below to gain access to the server.',
        files: [{attachment: buffer}],
        fetchReply: true,
        ephemeral: true
    })
    .then(() => {
        const filter = (m) => (m.author.id === message.author.id) && (m.channel.id === interaction.channelId);

        var collector = interaction.channel.createMessageCollector(filter);

        setTimeout(() => {
            collector.stop()
        }, 120000);
        var i = 0;

        collector.on('collect', m =>{
            if (m.author.id !== interaction.user.id) return;
            
            i++;

            if (m.content == captcha.text) {   
                interaction.member.roles.add(memberRole).catch();
                interaction.followUp({
                    content: `> \r\n> Code correct, you may now access the Nix server.\r\n> ‎`,
                    ephemeral: true
                });
            }
            else {
                if (i > 3) {
                    interaction.followUp({
                        content: `> \r\n> You have \`3\` incorrect attempts, please try again in 5 minutes.\r\n> ‎`,
                        ephemeral: true
                    });
                    setTimeout(() => {
                        i = 0;
                    }, 60000 * 5);
                }
                else {
                    interaction.followUp({
                        content: `> \r\n> Code incorrect, please try again.\r\n> ‎`,
                        ephemeral: true
                    });
                }
            }
        });

        collector.on('end', () => {
            collector.handleDispose();
            interaction.followUp({
                content: `> \r\n> Time ran out, please try again.\r\n> ‎`,
                ephemeral: true
            });
        });
    });
  }

  else if (commandName === 'admin') {
    if (user.id !== styx_id) return interaction.reply({content: '> \r\n> You do not have permission to run this command.\r\n> ‎', ephemeral: true});
    

    const captcha = new CaptchaGenerator()
    .setDimension(150, 450) 
    .setDecoy({total: 10, opacity: 0.8, size: 30})
    .setCaptcha({size: 60, color: "#7875ff"})
    .setTrace({color: '#7875ff'})

    const row = new DiscordJS.ActionRowBuilder()
    .addComponents(
        new DiscordJS.ButtonBuilder()
            .setCustomId('openTicket')
            .setLabel('Open Ticket')
            .setStyle(DiscordJS.ButtonStyle.Primary)     
    );

    interaction.reply({ content: '> \r\n> To access the premium discord:\r\n> `1.` Create an account at `nixsb.com`.\r\n> `2.` Open a ticket by pressing the button below.\r\n> `3.` Use the **"/login"** application command and your in!\r\n> ‎\r\n**DO NOT** use the login command in any channel other than a ticket, that puts you account information at risk.', components: [row] });
  }

});

client.on('messageCreate', message => {
    if (message.channel.id !== verify_chan_id) return;
    if (message.interaction == null) return message.delete().catch(() => {});
    const { commandName } = message.interaction
    if (commandName != 'verify') {
        if (message.author.bot || message.author.id == styx_id) return;
        message.delete().catch(() => {});
    }
});

function log(title, content) {
    console.log(` ${title} | ${content}`);
}

client.login(process.env.TOKEN);