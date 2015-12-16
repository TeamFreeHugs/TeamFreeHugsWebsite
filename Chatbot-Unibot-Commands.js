var killTypes = ['$1 was murdered',
    'Voldermort (aka Shadow Wizard) used Avada Kedavra on $1', '$1 disappeared for no reason',
    '$1 played too much Minecraft and got eaten by a zombie', '$1 sleeps with the fishes',
    '$1 has been entered into a Death Note', '$1 was accidentally decapitated in an old factory',
    'A noose appeared around $1\'s neck and he tripped and fell off a cliff', 'An axe fell on $1\'s head.',
    'in\u0252z\u0258m\u0252\u042f.A.M poured trifluoromethanesulfonic acid on $1'];

function randNum(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function toPingFormat(user) {
    return user.toString().replace(/[ \\|{}\[\];:'",<.>\/?!@#$%^&*\(\)_\-+=]/g, '');
}

module.exports = {
    help: function (args, room) {
        room.sendMessage('Hi. I\'m Uni\\*\'s Chatbot, in TFHCB, to challenge annoying girls who think they can fight programming.');
    }, kill: function (args, room) {
        if (args.length === 0) {
            room.sendMessage('Kill who?');
        } else {
            room.sendMessage(killTypes[randNum(0, killTypes.length - 1)].replace(/\$1/g, args.join(' ')));
        }
    }, echo: function (args, room) {
        if (args.length === 0)
            room.sendMessage('Nothing to echo!');
        else
            room.sendMessage(args.join(' '));
    }, coffee: function (args, room, event) {
        room.sendMessage('*Sends coffee to @' + toPingFormat(event.getSender()) + '*');
    }, toPingFormat: function (args, room) {
        if (args.length === 0) {
            room.sendMessage('Nothing!');
        } else {
            room.sendMessage('@' + toPingFormat(args));
        }
    }
};