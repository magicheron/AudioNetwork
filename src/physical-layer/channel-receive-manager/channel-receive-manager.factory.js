(function () {
    'use strict';

    AudioNetwork.Injector
        .registerFactory('PhysicalLayer.ChannelReceiveManager', _ChannelReceiveManager);

    _ChannelReceiveManager.$inject = [
        'PhysicalLayer.AbstractChannelManager',
        'PhysicalLayer.Audio',
        'PhysicalLayer.ChannelReceiveBuilder'
    ];

    function _ChannelReceiveManager(
        AbstractChannelManager,
        Audio,
        ChannelReceiveBuilder
    ) {
        var CRM;

        CRM = function (configuration, bufferSize) {
            AbstractChannelManager.apply(this, arguments);

            this.$$channelReceive = [];
            this.$$scriptNode = null;
            this.$$analyserNode = null;  // empty analyser needs to be connected to script node
            this.$$configuration = configuration;
            this.$$bufferSize = bufferSize;
            this.$$sampleNumberGlobal = 0;

            this.$$init();
        };

        CRM.prototype = Object.create(AbstractChannelManager.prototype);
        CRM.prototype.constructor = CRM;

        CRM.CHANNEL_INDEX_OUT_OF_RANGE_EXCEPTION = 'Channel index out of range: ';
        CRM.$$_LOWEST_FFT_SIZE = 256;

        CRM.prototype.destroy = function () {
            var i, cr;

            for (i = 0; i < this.$$channelReceive.length; i++) {
                cr = this.$$channelReceive[i];
                cr.destroy();
            }
            this.$$channelReceive.length = 0;
        };

        CRM.prototype.getInputNode = function () {
            return this.$$scriptNode;
        };

        CRM.prototype.getChannelSize = function () {
            return this.$$channelReceive.length;
        };

        CRM.prototype.getChannel = function (channelIndex) {
            if (channelIndex < 0 || channelIndex >= this.$$channelReceive.length) {
                throw CRM.CHANNEL_INDEX_OUT_OF_RANGE_EXCEPTION + channelIndex;
            }

            return this.$$channelReceive[channelIndex];
        };

        CRM.prototype.getBufferSize = function () {
            return this.$$scriptNode.bufferSize;
        };

        CRM.prototype.$$init = function () {
            var i, cr;

            this.$$scriptNode = Audio.createScriptProcessor(this.$$bufferSize, 1, 1);
            this.$$scriptNode.onaudioprocess = this.onAudioProcess.bind(this);

            this.$$analyserNode = Audio.createAnalyser();
            this.$$analyserNode.fftSize = CRM.$$_LOWEST_FFT_SIZE;

            this.$$scriptNode.connect(this.$$analyserNode);

            for (i = 0; i < this.$$configuration.length; i++) {
                cr = ChannelReceiveBuilder.build(i, this.$$configuration[i]);
                this.$$channelReceive.push(cr);
            }
        };

        CRM.prototype.onAudioProcess = function (audioProcessingEvent) {
            var
                inputBuffer = audioProcessingEvent.inputBuffer,
                inputData = inputBuffer.getChannelData(0),
                blockBeginTime = Audio.getCurrentTime(),
                sample, sampleNumberInBlock, j
            ;

            for (sampleNumberInBlock = 0; sampleNumberInBlock < inputBuffer.length; sampleNumberInBlock++) {
                sample = inputData[sampleNumberInBlock];

                for (j = 0; j < this.$$channelReceive.length; j++) {
                    this.$$channelReceive[j].handleSample(
                        sample, 
                        this.$$sampleNumberGlobal,
                        blockBeginTime,
                        sampleNumberInBlock
                    );
                }

                this.$$sampleNumberGlobal++;
            }

            this.$$computeCpuLoadData(blockBeginTime, Audio.getCurrentTime(), inputBuffer.length);
        };

        return CRM;
    }

})();
