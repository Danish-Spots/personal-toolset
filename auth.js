const cds = require('@sap/cds');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

// Create JWKS client for Keycloak
const client = jwksClient({
  jwksUri: process.env.KEYCLOAK_ISSUER + '/protocol/openid-connect/certs'
});
function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    callback(err, key.getPublicKey());
  });
}

module.exports = async (req, res, next) => {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.split(' ')[1];
    if (!token) { return res.sendStatus(401); }
    jwt.verify(token, getKey, {
      issuer: process.env.KEYCLOAK_ISSUER,
      algorithms: ['RS256']
    }, (err, decoded) => {
      if (err) return res.sendStatus(401);
      // Extract roles from Keycloak token
      const realmRoles = decoded.realm_access?.roles || [];
      const clientRoles = decoded.resource_access?.[process.env.KEYCLOAK_CLIENT_ID]?.roles || [];
      const roles = [...realmRoles, ...clientRoles];
      // Set CAP user
      cds.context.user = new cds.User({
        id: decoded.preferred_username || decoded.sub,
        roles: roles
      });
      next();
    });
  } catch (e) {
    res.sendStatus(401);
  }
};
