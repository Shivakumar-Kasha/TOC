/**
 * @Date:   01-27-2017 12:01:85
 * @Project: 24/7PizzaBOX
 * @Last modified time: 04-27-2017 15:04:72
 * @Copyright: 2017, Kii Corporation www.kii.com
 */

'use strict';

/**
 * Factory for login server call
 */
app.factory('loginService', function($window, $rootScope, $http, Session, CONFIG_DATA, AUTH_EVENTS, UserInfoCtrl, persistData) {
  var loginServiceInfo = {};

  loginServiceInfo.userInfo = {};

  loginServiceInfo.init = function() {
    if (loginServiceInfo.isLoggedIn()) {
      loginServiceInfo.currentUser();
    }
  };

  loginServiceInfo.login = function(user) {
    return $http
      .post(CONFIG_DATA.SERVER_URL + CONFIG_DATA.LOGIN.method, user, {
        headers: CONFIG_DATA.HEADERS
      });
  };

  loginServiceInfo.resetPassword = function(user) {
    return $http
      .post(CONFIG_DATA.SERVER_URL + CONFIG_DATA.RESET_PASSWORD.method, user, {
        headers: CONFIG_DATA.HEADERS
      });
  };

  //logout the user and broadcast the logoutSuccess event
  loginServiceInfo.logout = function() {
    Session.destroy();
    $window.sessionStorage.removeItem("sessionInfo");
    $rootScope.$broadcast(AUTH_EVENTS.logoutSuccess);
  };

  loginServiceInfo.isAuthenticated = function() {
    return !!Session.userRole;
  };

  loginServiceInfo.isAuthorized = function(authorizedRoles) {
    if (!angular.isArray(authorizedRoles)) {
      authorizedRoles = [authorizedRoles];
    }
    return (loginServiceInfo.isAuthenticated() &&
      authorizedRoles.indexOf(Session.userRole) !== -1 &&
      authorizedRoles.indexOf(Session.tenantType) !== -1);
  };

  loginServiceInfo.currentUser = function() {
    var data = JSON.parse($window.sessionStorage["sessionInfo"]).session;
    Session.create(data.token, data.userName, data.userMail, data.userRole, data.tenantType, data.tenantId, data.tenantName, data.userImage, data.expiresIn);
    UserInfoCtrl.setCurrentUser(data);
    return JSON.parse($window.sessionStorage["sessionInfo"]).session.userName;
  };

  loginServiceInfo.isLoggedIn = function() {
    return persistData.isValid($window.sessionStorage["sessionInfo"]);
  };

  return loginServiceInfo;
});
