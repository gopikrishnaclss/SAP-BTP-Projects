sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"caplist09/test/integration/pages/bikeList",
	"caplist09/test/integration/pages/bikeObjectPage"
], function (JourneyRunner, bikeList, bikeObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('caplist09') + '/test/flp.html#app-preview',
        pages: {
			onThebikeList: bikeList,
			onThebikeObjectPage: bikeObjectPage
        },
        async: true
    });

    return runner;
});

