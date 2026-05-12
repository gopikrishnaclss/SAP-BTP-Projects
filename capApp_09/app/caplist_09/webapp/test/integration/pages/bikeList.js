sap.ui.define(['sap/fe/test/ListReport'], function(ListReport) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ListReport(
        {
            appId: 'caplist09',
            componentId: 'bikeList',
            contextPath: '/bike'
        },
        CustomPageDefinitions
    );
});