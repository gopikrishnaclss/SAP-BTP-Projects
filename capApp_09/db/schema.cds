namespace Vehicles;
entity bike{
    key ID : UUID;
    bike_name : String;
    price:Decimal;
}
entity car{
    key ID:UUID;
    car_name:String;
    Brand_Name:String;
    type:String;
    engine_type:String;
    drive:String;
    warranty_period:Integer;
}
entity user{
    key user_ID:String;
    password:String
}
