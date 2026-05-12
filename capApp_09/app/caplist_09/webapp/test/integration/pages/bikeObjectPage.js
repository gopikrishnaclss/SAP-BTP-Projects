sap.ui.define(['sap/fe/test/ObjectPage'], function(ObjectPage) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ObjectPage(
        {
            appId: 'caplist09',
            componentId: 'bikeObjectPage',
            contextPath: '/bike'
        },
        CustomPageDefinitions
    );
});