const Hapi = require('hapi');
const Inert = require('inert');
const qs = require('qs');
const env = require('env2');
const request = require('request');
const CookieAuth = require('hapi-auth-cookie');
const Vision = require('vision');
const Handlebars = require('handlebars');

env('./config.env');

const server = new Hapi.Server();

server.connection( {
  host: 'localhost',
  port: process.env.PORT || 4000
})

server.register([Inert, CookieAuth, Vision], (err) => {
  if(err) throw err;

  server.views({
    engines: { hbs: Handlebars },
    path: './views',
    layoutPath: './views/layout',
    layout: 'default'
  });

  const options = {
    password: 'm!"2/),p4:xDs%KEgVr7;e#85Ah^WYCfesdfewkhbwekhb',
    cookie: 'cookie-name',
    isSecure: false,
    ttl: 24 * 60 * 60 * 1000
  };

  server.auth.strategy('session', 'cookie', 'optional', options);

  server.route([
    {
      method: 'GET',
      path: '/{param*}',
      handler: (req, reply) => {
        reply.file('./public/main.html');
    }

    },
      {
      method: 'GET',
      path: "/login",
      handler: (req, reply) => {
        // var obj = {
        //   client_id: process.env.CLIENT_ID,
        //   redirect_uri: process.env.BASE_URL+'/welcome'
        // }
        // var str = qs.stringify(obj);
        // var url = `https://github.com/login/oauth/authorize/${str}`

        var client_id = process.env.CLIENT_ID;
        var redirect_uri = 'http://localhost:4000/welcome';
        var url = 'https://github.com/login/oauth/authorize/'
        reply.redirect(`${url}?client_id=${client_id}&redirect_uri=${redirect_uri}`)
      }
    },
    {
      method: 'GET',
      path:'/welcome',
      handler: (req, reply) => {
        var url = 'https://github.com/login/oauth/access_token'
        var header = {
          accept: 'application/json'
        }
        var form = {
          client_id: process.env.CLIENT_ID,
          code: req.query.code,
          client_secret: process.env.CLIENT_SECRET
        }
        request.post({url:url, headers: header, form:form}, function (error, response, body) {
          if (!error && response.statusCode == 200) {
            var body = JSON.parse(body)
            req.cookieAuth.set(body);
            reply.redirect('/githubuser');
          }
        })
      }
    },
    {
      method:'GET',
      path:'/githubuser',
      handler: (req, reply) => {
        var header = {
         'User-Agent': 'oauth-ws',
         Authorization: `token ${req.auth.credentials.access_token}`
        }
        var url = `https://api.github.com/user`;
        request.get({url:url, headers:header}, function (error, response, body) {
          console.log(body);
          reply.view('userinfo', JSON.parse(body));
        })
      }
    },
    {
      method:'GET',
      path:'/repos',
      handler: (req, reply) => {
        var header = {
         'User-Agent': 'oauth-ws',
         Authorization: `token ${req.auth.credentials.access_token}`
        }
        var url = `https://api.github.com/user/repos`;
        request.get({url:url, headers:header}, function (error, response, body) {
          var repos = JSON.parse(body);
          reply.view('repos', { repos });
        })
      }
    },
    {
      method:'GET',
      path:'/orgs',
      handler: (req, reply) => {
        var header = {
         'User-Agent': 'oauth-ws',
         Authorization: `token ${req.auth.credentials.access_token}`
        }
        var url = `https://api.github.com/user/orgs`;
        request.get({url:url, headers:header}, function (error, response, body) {
          var orgs = JSON.parse(body);
          reply.view('orgs', { orgs });
        })
      }
    }

  ]
);
});

module.exports = server;
