namespace app;

entity Products {
  key ID       : UUID;
  name         : String;
  price        : Decimal;
  category     : String;
}