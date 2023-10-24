// Este código traceia o número de tenttivas de login

let loginAttempts = {};

module.exports = {
  getLoginAttempts: function (ip) {
    return loginAttempts[ip] || 0;
  },
  incrementLoginAttempt: function (ip) {
    if (!loginAttempts[ip]) {
      loginAttempts[ip] = 1;
    } else {
      loginAttempts[ip]++;
    }
  },
  resetLoginAttempts: function (ip) {
    loginAttempts[ip] = 0;
  },
};
