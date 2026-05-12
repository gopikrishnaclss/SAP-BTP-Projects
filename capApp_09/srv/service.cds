using { Vehicles } from '../db/schema';

@requires: 'admin'
service BikeService @(path:'/BikeService'){
    @odata.draft.enabled
    entity bike as projection on Vehicles.bike;
}
@requires:'admin'
service carServiceORead @(path:'/carServiceReader'){   
    entity carReader as projection on Vehicles.car;
}
annotate BikeService.bike with @(UI: {
    LineItem             : [
        {
            $Type: 'UI.DataField',
            Value: ID
        },
        {
            $Type: 'UI.DataField',
            Value: bike_name
        },
        {
            $Type: 'UI.DataField',
            Value: price
        }
    ],
    FieldGroup #BasicData: {
        $Type: 'UI.FieldGroupType',
        Data : [
            {
                $Type: 'UI.DataField',
                Value: ID
            },
            {
                $Type: 'UI.DataField',
                Value: bike_name
            },
            {
                $Type: 'UI.DataField',
                Value: price
            }

        ]
    },
    Facets               : [{
        $Type : 'UI.ReferenceFacet',
        Target: '@UI.FieldGroup#BasicData'
    }]

}) {
    bike_name @title: 'BikeName';
};
