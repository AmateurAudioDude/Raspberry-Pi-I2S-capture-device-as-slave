const { spawn } = require('child_process');
const ffmpeg = require('ffmpeg-static');
const { configName, serverConfig, configUpdate, configSave, configExists } = require('../server_config');
const { logDebug, logError, logInfo, logWarn, logFfmpeg } = require('../console');
  
function enableAudioStream() {
    var ffmpegParams, ffmpegCommand;
    serverConfig.webserver.webserverPort = Number(serverConfig.webserver.webserverPort);

    const flags = `-fflags +nobuffer+flush_packets -flags low_delay -rtbufsize 6192 -probesize 32`;
    const codec = `-acodec pcm_s16le -ar 48000 -ac ${serverConfig.audio.audioChannels}`;
    const output = `-f s16le -fflags +nobuffer+flush_packets -packetsize 384 -flush_packets 1 -bufsize 960`;

    if (process.platform === 'win32') {
        // Windows
        ffmpegCommand = "\"" + ffmpeg.replace(/\\/g, '\\\\') + "\"";
        ffmpegParams = `${flags} -f dshow -audio_buffer_size 200 -i audio="${serverConfig.audio.audioDevice}" ${codec} ${output} pipe:1 | node server/stream/3las.server.js -port ${serverConfig.webserver.webserverPort + 10} -samplerate 48000 -channels ${serverConfig.audio.audioChannels}`;
      } else {
        // Linux
        let audio_i2s = serverConfig.audio.audioDevice;
        if (audio_i2s !== 'hw:sndrpii2scard' && audio_i2s !== 'hw:i2srecorddevice') {
          // Sound card command
          ffmpegCommand = 'ffmpeg';
          ffmpegParams = `${flags} -f alsa -i "${serverConfig.audio.softwareMode && serverConfig.audio.softwareMode == true ? 'plug' : ''}${serverConfig.audio.audioDevice}" ${codec}`;
        } else {
          // I2S command
          ffmpegCommand = `while true; do arecord -D ${serverConfig.audio.softwareMode && serverConfig.audio.softwareMode == true ? 'plug' : ''}${serverConfig.audio.audioDevice} -f S16_LE -c2 -r48000 -t raw -; done | ffmpeg`;
          // 48000/48000 when TEF is slave, 48000/48001 when TEF is master
          ffmpegParams = `${flags} -f s16le -ar 48000 -ac 2 -i - -filter_complex "aresample=async=1:min_hard_comp=0.001:first_pts=0" -ar 48001 -ac 2`;
        }
        ffmpegParams += ` ${output} -reconnect 1 -reconnect_streamed 1 -reconnect_delay_max 10 pipe:1 | node server/stream/3las.server.js -port ${serverConfig.webserver.webserverPort + 10} -samplerate 48000 -channels ${serverConfig.audio.audioChannels}`;
      }

    logInfo("Trying to start audio stream on device: \x1b[35m" + serverConfig.audio.audioDevice);
    logInfo(`Using internal audio network port ${serverConfig.webserver.webserverPort + 10}.`);

    // If an audio device is configured, start the stream
    if(serverConfig.audio.audioDevice.length > 2) {
        let startupSuccess = false;
        const childProcess = spawn(ffmpegCommand, [ffmpegParams], { shell: true });

        childProcess.stdout.on('data', (data) => {
            logFfmpeg(`stdout: ${data}`);
        });

        childProcess.stderr.on('data', (data) => {
            logFfmpeg(`stderr: ${data}`);
            if(data.includes('I/O error')) {
                logError('Audio device \x1b[35m' + serverConfig.audio.audioDevice + '\x1b[0m failed to start. Start server with the command \x1b[33mnode . --ffmpegdebug \x1b[0mfor more info.');
            }
            if(data.includes('size=') && startupSuccess === false) {
                logInfo('Audio stream started up successfully.');
                startupSuccess = true;
            }
        });
    
        childProcess.on('close', (code) => {
            logFfmpeg(`Child process exited with code ${code}`);
        });
    
        childProcess.on('error', (err) => {
            logFfmpeg(`Error starting child process: ${err}`);
        });
    }
}

if(configExists()) {
    enableAudioStream();
}
