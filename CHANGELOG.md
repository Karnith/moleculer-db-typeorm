
--------------------------------------------------
<a name="0.0.1"></a>
# 0.0.1 (2020-05-18)

## Changes
- fix `.list` has been fixed to display `total` rows of current page.
- A switch statement has been added in `created()` method to toggle standard or multi-tenant mode
- `started()` methos has been changed to auto connect when in standard mode, leaving the need to use `.connect()` manually when in multi-tenant mode

## New
- added `mode:` field to service schema to goggle `standard` or multi-tenant `mt` modes. 
- Using `this.connect()` empty will connect the service to database with a standard connection, while using `this.connect(mode, options, callback)` will create a new connection in the current service when multi-tenant mode `mt` is defined for mode and the connection will be returned in the callback to use. To dissconnect db connection, use `this.disconnect()` in standard mode. in multi-tenant mode, `this.disconnect()` will only disconnect the service connection made. to disconnect additional connections made in `mt` mode, use the `.close()` methosd of teh adapter.

## Example

```js

const productOpts = {
    database: 'products',
    name: 'products',
    type: 'mongodb',
    host: 'localhost',
    port: 27017,
    entities: [Products],
    synchronize: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
};
let productsConnection: Connection;
await this.connect('mt', productOpts, (conn: Connection) => {
    return (productsConnection = conn);
});

console.log(await productsConnection!.getMongoRepository(Products).find());
await productsConnection!.close();
        
```

--------------------------------------------------
