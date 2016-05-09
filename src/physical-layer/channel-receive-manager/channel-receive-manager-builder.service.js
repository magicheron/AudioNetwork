(function () {
    'use strict';

    AudioNetwork.Injector
        .registerService('PhysicalLayer.ChannelReceiveManagerBuilder', _ChannelReceiveManagerBuilder);

    _ChannelReceiveManagerBuilder.$inject = [
        'PhysicalLayer.ChannelReceiveManager'
    ];

    function _ChannelReceiveManagerBuilder(
        ChannelReceiveManager
    ) {

        function build(configuration, bufferSize) {
            return new ChannelReceiveManager(configuration, bufferSize);
        }

        return {
            build: build
        };
    }

})();
