module.exports = {

  handler: function(req, res, next) {
    allRoles = [];
    database.query("SELECT * FROM roles JOIN servers ON roles.fk_server = servers.id", function(err, rows, field){
      if(err)
        throw err;

        for (var i = 0; i < rows.length; i++) {
            allRoles[rows[i].name] = '<span class="glyphicon glyphicon-ok" aria-hidden="true"></span>';
        }

      });

      res.locals = {
        menuStatus: allRoles
      };

      next();
  }
};
