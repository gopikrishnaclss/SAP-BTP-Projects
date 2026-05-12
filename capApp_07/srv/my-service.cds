
@requires: 'Viewer'
service MyService @(path: '/myservice') 

  {
    @readonly
    entity Products as projection on app.Products;
  }

              