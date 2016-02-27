var AudioNetworkDevice = (function () {
    'use strict';

    /*
    TODO
         + real/imm delete
         + compute at getCarrier
         + index passed into handler
         + decibel power/amplitude check
         + load wav file

         - rewrite main API
            - move code to factory
            - ability to change frequency
            - cleanup inside main service
            - internal notifyHandler for constellation update, external for user purposes
         - use dedicated constellation at carrier.html

        Performance
         - move script processor node to receive manager
         - do not redraw constellation if queue wasn't changed
         - move sin/cos to internal Math service (to give ability to quickly add lookup tables)
    */

    _AudioNetworkDevice.$inject = [];

    function _AudioNetworkDevice() {
        var
            analyser,
            analyserChart,
            channelTransmitManager,
            channelReceiveManager,
            constellationData = [
                {
                    constellationDiagram: [],
                    queue: []
                },
                {
                    constellationDiagram: [],
                    queue: []
                },
                {
                    constellationDiagram: [],
                    queue: []
                }
            ]
        ;

        function notifyHandler(index, carrierData) {
            var state, i, cd, spaces, _, q, powerNormalized;

            _ = constellationData[index];
            spaces = "             ";
            state = "";//(spaces + baseFrequency).slice(-10) + 'Hz | ';
            for (i = 0; i < carrierData.length; i++) {
                q = _.queue[i];

                cd = carrierData[i];
                if (cd.powerDecibel === -Infinity) {
                    cd.powerDecibel = -999;
                }
                if (q) {
                    powerNormalized = (cd.powerDecibel + 40) / 40;
                    powerNormalized = powerNormalized < 0 ? 0 : powerNormalized;
                    if (q.isFull()) {
                        q.pop();
                        q.pop();
                    }
                    q.push(powerNormalized * Math.cos(2 * Math.PI * cd.phase));
                    q.push(powerNormalized * Math.sin(2 * Math.PI * cd.phase));
                }
                state += (
                    (spaces + Math.round(cd.powerDecibel)).slice(-4) + 'dB ' +
                    (spaces + Math.round(cd.phase * 360)).slice(-3) + 'deg ' +
                    ' | '
                );
            }

            document.getElementById('receive-' + index).innerHTML = state;
        }

        function configureNodes() {
            var
                queue,
                queueSize = 50,
                dftSize = Audio.getSampleRate() * 0.100,
                notificationPerSecond = 20,
                notifyInterval = Audio.getSampleRate() * (1 / notificationPerSecond);

            channelReceiveManager = ChannelReceiveManagerBuilder.build([
                {
                    baseFrequency: 1070.04, ofdmSize: 1, ofdmFrequencySpacing: 100,
                    dftSize: dftSize, notifyInterval: notifyInterval, notifyHandler: notifyHandler
                },
                {
                    baseFrequency: 2025.05, ofdmSize: 1, ofdmFrequencySpacing: 100,
                    dftSize: dftSize, notifyInterval: notifyInterval, notifyHandler: notifyHandler
                }
            ]);

            queue = QueueBuilder.build(2 * queueSize);
            constellationData[0].queue.push(queue);
            constellationData[0].constellationDiagram.push(new ConstellationDiagram(document.getElementById('receive-0-cd-0'), queue, 200, 200));

            /*
            queue = QueueBuilder.build(2 * queueSize);
            constellationData[0].queue.push(queue);
            constellationData[0].constellationDiagram.push(new ConstellationDiagram(document.getElementById('receive-0-cd-1'), queue, 200, 200));
            */

            queue = QueueBuilder.build(2 * queueSize);
            constellationData[1].queue.push(queue);
            constellationData[1].constellationDiagram.push(new ConstellationDiagram(document.getElementById('receive-1-cd-0'), queue, 200, 200));


            analyser = Audio.createAnalyser();
            analyser.fftSize = 1 * 1024;

            switch (0) {
                case 0:
                    Audio.getMicrophoneNode().connect(analyser);
                    Audio.getMicrophoneNode().connect(channelReceiveManager.getInputNode());
                    break;
                case 1:
                    //Audio.loadRecordedAudio('http://codebuild.pl/an.wav');
                    //Audio.loadRecordedAudio('http://codebuild.pl/an100ms.wav');
                    //Audio.loadRecordedAudio('http://localhost:63342/ucEmu/an.wav');
                    //Audio.loadRecordedAudio('http://localhost:63342/ucEmu/an100ms.wav');
                    Audio.getRecordedNode().connect(analyser);
                    Audio.getRecordedNode().connect(channelReceiveManager.getInputNode());
                    break;
                case 2:
                    channelTransmitManager.getOutputNode().connect(analyser);
                    channelTransmitManager.getOutputNode().connect(channelReceiveManager.getInputNode());
                    break;
            }

            analyserChart = AnalyserChartBuilder.build(document.getElementById('test'), analyser);
        }

        return {

        };
    }

    return new _AudioNetworkDevice();        // TODO change it to dependency injection

})();