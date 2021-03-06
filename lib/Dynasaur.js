// Generated by CoffeeScript 1.3.3
(function() {
  var Dynasaur, Model, colors, dynamo,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  dynamo = require('dynamo');

  colors = require('colors');

  Model = require('./model');

  Dynasaur = (function() {

    Dynasaur.prototype.models = {};

    Dynasaur.prototype.model_instances = [];

    function Dynasaur(aws_credentials, project_name) {
      var dynamo_client;
      this.aws_credentials = aws_credentials;
      this.project_name = project_name;
      this.unpause = __bind(this.unpause, this);

      console.log('Dynasaur: '.yellow, 'Welcome to Dynasaur, connecting to DynamoDB');
      this.paused = true;
      this.queued_actions = [];
      this.schemas = [];
      dynamo_client = dynamo.createClient(this.aws_credentials);
      this.dynamo_db = dynamo_client.get('us-west-1');
      this.checkForProjectConfig();
    }

    Dynasaur.prototype.checkForProjectConfig = function() {
      var config_table_name, table,
        _this = this;
      console.log('Dynasaur: '.yellow, 'Checking to see if config present');
      config_table_name = "" + this.project_name + "_config";
      table = this.dynamo_db.get(config_table_name);
      return table.fetch(function(err, table) {
        var config_schema, schema, _i, _len, _ref;
        if (err) {
          console.log('Dynasaur: '.yellow, 'Initializing indexed table for the first time ...');
          config_schema = {
            name: config_table_name,
            model_type: String
          };
          return _this.dynamo_db.add(config_table_name, config_schema).save(function(err, table) {
            console.log('Dynasaur: '.yellow, 'Config table not found but has been made');
            return _this.unpause();
          });
        } else {
          console.log('Dynasaur: '.yellow, 'Recognized database, checking if all indexed tables are current ...');
          _ref = _this.schemas;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            schema = _ref[_i];
            _this.checkIndicies(table, schema);
          }
          return _this.unpause();
        }
      });
    };

    Dynasaur.prototype.checkIndicies = function(table, schema) {
      return console.log('Dynasaur: '.yellow, 'Checking ' + schema.name + ' Indicies');
    };

    Dynasaur.prototype.unpause = function() {
      var action, _i, _len, _ref, _results;
      this.paused = false;
      _ref = this.queued_actions;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        action = _ref[_i];
        _results.push(action());
      }
      return _results;
    };

    Dynasaur.prototype.model = function(name, schema) {
      var model_type, table,
        _this = this;
      this.schemas.push({
        name: name,
        schema: schema
      });
      model_type = new Model(name, schema);
      this.models[name] = model_type;
      table = this.dynamo_db.get(name);
      if (this.paused) {
        this.queued_actions.push(function() {
          return table.fetch(function(err, table) {
            if (err) {
              return _this.dynamo_db.add(name, schema).save(function(err, table) {
                return table.watch(function(err, table) {
                  console.log('Dynasaur: '.yellow, 'Created ' + model_type.model.name + ' table');
                  return model_type.setTable(table);
                });
              });
            } else {
              return model_type.setTable(table);
            }
          });
        });
      } else {
        table.fetch(function(err, table) {
          if (err) {
            return _this.dynamo_db.add(name, schema).save(function(err, table) {
              return table.watch(function(err, table) {
                return model_type.setTable(table);
              });
            });
          } else {
            return model_type.setTable(table);
          }
        });
      }
      return model_type;
    };

    return Dynasaur;

  })();

  module.exports = Dynasaur;

}).call(this);
