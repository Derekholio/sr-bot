var fs = require('fs');
var schedule = require('node-schedule');
var overwatch = require('overwatch-api');

/**
 * Globals
 */
const PLATFORM = 'pc';
const REGION = 'us';

/**
 * Gets user data from overwatch API
 */
async function getOverwatchProfileAsync(player) {
    return new Promise((resolve, reject) => {
        overwatch.getProfile(PLATFORM, REGION, player.player.replace('#', '-'), (error, data) => {
            if (error) { 
                error.username = player.player; 
                reject(error); 
            }else{
                data.OriginalUsername = player.player;
                resolve(data);
            }
        });
    })
}

// async function processServerAsync(server){
//     return new Promise((resolve, reject) => {
//         var players = server.players;
//         var playersData = await Promise.all(players.map(player => getOverwatchProfileAsync(player).catch(err => { console.log(err); }))).catch(err => { throw new Error(err) });
//         if (error) { reject(error); }

//         if(!error){
//             resolve(playersData);
//         }
//     });
// }

async function main() {
    // Loads in the players.json.  Assuming the file looks like JSON{players: [{...}, {...}, {...}]}
    const servers = JSON.parse(fs.readFileSync('players.json', 'utf8'));
    console.log(JSON.stringify(servers));
    for(var server of servers){
        var players = server.players;
        const playersData = await Promise.all(
            players.map(player => getOverwatchProfileAsync(player)
            .catch(err => { console.log('Failed: ' + err.username); console.log(err); })))
            .catch(err => { throw new Error(err) });

        const sanitizedPlayerData = playersData.filter(player => player !== null && player !== undefined && player.username !== null && player.username !== undefined && player.username.length !== 0).map(player => {
            return {
                SR: player.competitive.rank,
                player: player.OriginalUsername
            }
        });

        players.forEach(function (player, index, arr) {
            sanitizedPlayerData.forEach(function (p, i, a) {
                if (player.player == p.player) {
                    if(p.SR && p.SR > 0){
                        players[index].SR = p.SR;
                    }else{
                        console.log('Private scrub: ' + players[index].player);
                        players[index].private = true;
                    }
                }
            })
        });

        servers.players = players;
    }

    console.log(JSON.stringify(servers));
    fs.writeFileSync('players.json', JSON.stringify(servers), 'utf8');
    console.log('Saved players');
}

main();

schedule.scheduleJob("0 0 * * * *", function () {
    main();
});