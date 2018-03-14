/**
 * @Date:   01-27-2017 12:01:51
 * @Project: AssetMonitoring
 * @Last modified time: 07-06-2017 17:41:46
 * @Copyright: 2017, Kii Corporation www.kii.com
 */

'use strict';

/**
 * Controller to fetch tenant users
 */
angular.module('assetManagementApp').controller('TenantUsersCtrl', function($rootScope, $scope, $uibModal, $compile, $translate, Session, CONFIG_DATA, DTOptionsBuilder, DTColumnBuilder, persistData, logReport, toastNotifier, alertNotifier, dataTable) {
    alertNotifier.clearAlerts();
    var draw = null;
    var vm = this;
    vm.dtInstance = {};
    vm.users = {};
    vm.edit = editTenantUser;
    vm.delete = deleteTenantUser;
    $.fn.dataTable.ext.errMode = 'none';
    $rootScope.tenantUserRoles = CONFIG_DATA.USERS.tenantUserRoles;

    vm.dtOptions = DTOptionsBuilder.newOptions()
      .withOption('ajax', {
        url: CONFIG_DATA.SERVER_URL + CONFIG_DATA.USERS.getMethod,
        type: 'POST',
        data: function(d) {
          draw = d.draw;
          d.userToken = Session.token;
          d.nextPaginationKey = CONFIG_DATA.DATA_TABLE.records + "/" + d.start;
          d.filter = [{
            key: 'userMail',
            value: Session.userMail,
            filterType: 'neq'
          }];

          if (d.order[0].column === 0) {
            d.order = {
              dir: d.order[0].dir,
              column: 'userMail'
            };
          } else if (d.order[0].column === 1) {
            d.order = {
              dir: d.order[0].dir,
              column: 'userName'
            };
          } else if (d.order[0].column === 2) {
            d.order = {
              dir: d.order[0].dir,
              column: 'userRole'
            };
          } else if (d.order[0].column === 3) {
            d.order = {
              dir: d.order[0].dir,
              column: 'userStatus'
            };
          }

          if (persistData.isValid(d.search.value)) {
            var search = {
              key: CONFIG_DATA.SEARCH.users.searchBy,
              value: d.search.value.toLowerCase(),
              filterType: CONFIG_DATA.SEARCH.users.filterType
            };
            d.filter.push(search);
          }
          logReport.info("Get User Query", JSON.stringify(d));
          return JSON.stringify(d);
        },
        headers: CONFIG_DATA.HEADERS,
        beforeSend: function() {
          $rootScope.ajaxloading = true;
          if (!$rootScope.$$phase) {
            $rootScope.$apply();
          }
        },
        complete: function() {
          $rootScope.ajaxloading = false;
          $rootScope.$apply();
        },
        dataType: "json",
        converters: {
          "text json": function(result) {
            var response = dataTable.filterData(result, draw);
            logReport.info("Get User Information", JSON.stringify(response));
            return response;
          }
        },
        error: function(error) {
          logReport.error("Get User Information", JSON.stringify(error));
          toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
        }
      })
      .withDataProp(function(result) {
        return result.data;
      })
      .withBootstrap()
      .withOption('lengthMenu', [
        [10, 20, 30, 40],
        [10, 20, 30, 40]
      ])
      .withOption('responsive', {
        details: {
          renderer: function(api, rowIndex) {
            var data = dataTable.rendererRows(api, rowIndex);
            // gets the table and append the rows
            var table = angular
              .element('<table/>')
              .append(data);

            // compile the table to keep the events
            $compile(table.contents())($scope);

            return table;
          }
        }
      })
      .withOption('createdRow', createdRow)
      .withOption('language', {
        searchPlaceholder: $translate.instant('PLACE_HOLDERS.ENTER_USER_NAME')
      })
      .withOption('serverSide', true);

    vm.dtColumns = [
      DTColumnBuilder.newColumn('userMail'),
      DTColumnBuilder.newColumn('userName'),
      DTColumnBuilder.newColumn('userRole'),
      DTColumnBuilder.newColumn('userStatus'),
      DTColumnBuilder.newColumn(null).notSortable()
      .renderWith(actionsHtml)
    ];

    function createdRow(row, data, dataIndex) {
      // Recompiling so we can bind Angular directive to the DT
      $compile(angular.element(row).contents())($scope);
    }

    function actionsHtml(data, type, full, meta) {
      vm.users[data.id] = data;
      return '<center><button type="button" class="btn btn-warning btn-circle" title="Edit" ng-click="tenantUsersInfo.edit(tenantUsersInfo.users[' + data.id + '])">' +
        '   <i class="fa fa-edit"></i>' +
        '</button>&nbsp;' +
        '<button type="button" class="btn btn-danger btn-circle" title="Delete" ng-click="tenantUsersInfo.delete(tenantUsersInfo.users[' + data.id + '])" )"="">' +
        '   <i class="fa fa-trash-o"></i>' +
        '</button></center>';
    }

    //Add Tenant User Information
    $scope.addTenantUser = function(size) {
      $rootScope.modalInstance = $uibModal.open({
        templateUrl: 'addTenantUserContent.html',
        controller: 'AddTenantUserCtrl',
        backdrop: 'static',
        keyboard: true,
        size: size,
        resolve: {
          vm: function() {
            return vm;
          }
        }
      });
    };

    /**
     * Function to edit tenant user information
     * @param  {JSON} userInfo
     */
    function editTenantUser(userInfo) {
      $rootScope.modalInstance = $uibModal.open({
        templateUrl: 'addTenantUserContent.html',
        controller: 'EditTenantUserCtrl',
        backdrop: 'static',
        keyboard: true,
        resolve: {
          userInfo: function() {
            return userInfo;
          },
          vm: function() {
            return vm;
          }
        }
      });
    }

    /**
     * Function to delete tenant user information
     * @param  {JSON} userInfo
     */
    function deleteTenantUser(userInfo) {
      $rootScope.modalInstance = $uibModal.open({
        templateUrl: 'deleteTenantUserContent.html',
        controller: 'DeleteTenantUserCtrl',
        backdrop: 'static',
        keyboard: true,
        resolve: {
          userInfo: function() {
            return userInfo;
          },
          vm: function() {
            return vm;
          }
        }
      });
    }
  })

  /**
   * Controller to add tenant user information
   */
  .controller('AddTenantUserCtrl', function($rootScope, $scope, $translate, Session, REG_EXP, persistData, logReport, toastNotifier, alertNotifier, usersService, vm, utilityFunctions) {
    alertNotifier.clearAlerts();
    angular.extend($scope, {
      Add_or_Edit_User: $translate.instant('CRUD.ADD'),
      Add_or_Update: $translate.instant('BUTTONS.CREATE'),
      mandatory_or_optional: $translate.instant('PLACE_HOLDERS.MANDATORY'),
      isPasswordMandatory: true,
      readOnly: "false",
      focusUsername: "true",
      focusFirstName: "false",
      emailPattern: REG_EXP.email,
      type: "password",
      isGenerateChecked: true,
      user: {
        userRole: $rootScope.tenantUserRoles[0].option,
        userStatus: 'Active'
      },
      generateRandomPassword: function() {
        utilityFunctions.generateRandomAlphaNumericString(this, 8);
      },
      hideShowPassword: function() {
        utilityFunctions.showHidePassword(this);
      }
    });

    $scope.submit = function() {
      var customFields = {
        userMail: $scope.user.username.toLowerCase(),
        firstName: $scope.user.firstName,
        lastName: $scope.user.lastName,
        userAddress: $scope.user.userAddress,
        phoneNumber: $scope.user.phoneNumber,
        c_image: '',
        userRole: $scope.user.userRole,
        userStatus: $scope.user.userStatus
      };


      var userData = {
        userData: customFields,
        sendMailTo: $scope.user.sendMailTo,
        userPassword: $scope.user.password,
        userToken: Session.token
      };

      logReport.info("Add User Information", JSON.stringify(userData));

      usersService.addUser(userData).
      then(function(result) {
          var customInfo = {
            successMessage: $translate.instant('USERS.SUCCESS.CREATION_SUCCESS'),
            alreadyExists: $translate.instant('USERS.ERROR.ALREADY_EXISTS'),
            errorMessage: $translate.instant('USERS.ERROR.CREATION_FAIL')
          };

          var validData = persistData.validifyData(result, customInfo);
          logReport.error("Valid Data", JSON.stringify(validData));
          if (Object.keys(validData).length !== 0) {
            vm.dtInstance.reloadData(null, false);
            if (persistData.isValid($scope.user.userImage)) {
              utilityFunctions.uploadImage({
                imageDataUri: $scope.user.userImage,
                objectUri: validData.data.objectURI,
                table: vm
              });
            }
          }
        },
        function(error) {
          logReport.error("Add User Information", JSON.stringify(error));
          toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
        }
      );
    };
  })
  /**
   * Controller to edit tenant user information
   */
  .controller('EditTenantUserCtrl', function($scope, $translate, Session, persistData, logReport, toastNotifier, alertNotifier, usersService, REG_EXP, userInfo, vm, utilityFunctions) {
    alertNotifier.clearAlerts();
    angular.extend($scope, {
      Add_or_Edit_User: $translate.instant('CRUD.EDIT'),
      Add_or_Update: $translate.instant('BUTTONS.UPDATE'),
      mandatory_or_optional: $translate.instant('PLACE_HOLDERS.OPTIONAL'),
      isPasswordMandatory: false,
      readOnly: "true",
      focusUsername: "false",
      focusFirstName: "true",
      emailPattern: REG_EXP.email,
      type: "password",
      isGenerateChecked: false,
      user: {
        username: userInfo.userMail,
        lastName: userInfo.lastName,
        firstName: userInfo.firstName,
        userAddress: userInfo.userAddress,
        phoneNumber: userInfo.phoneNumber,
        userRole: userInfo.userRole,
        userStatus: userInfo.userStatus,
        sendMailTo: userInfo.userMail,
        userImage: userInfo.c_image
      },
      generateRandomPassword: function() {
        utilityFunctions.generateRandomAlphaNumericString(this, 8);
      },
      hideShowPassword: function() {
        utilityFunctions.showHidePassword(this);
      }
    });
    logReport.error(JSON.stringify(userInfo));

    $scope.submit = function() {
      var imageDataUri = $scope.user.userImage;
      if (!persistData.isValid($scope.user.password)) {
        $scope.user.sendMailTo = '';
      }
      var data = {
        userToken: Session.token,
        sendMailTo: $scope.user.sendMailTo,
        userEmailToUpdate: $scope.user.username,
        userPassword: $scope.user.password,
        userData: {
          firstName: $scope.user.firstName,
          phoneNumber: $scope.user.phoneNumber,
          lastName: $scope.user.lastName,
          userAddress: $scope.user.userAddress,
          userRole: $scope.user.userRole,
          userStatus: $scope.user.userStatus
        }
      };

      logReport.info("Edit User Information", JSON.stringify(data));

      usersService.editUser(data).
      then(function(result) {
          var customInfo = {
            successMessage: $translate.instant('USERS.SUCCESS.UPDATION_SUCCESS'),
            alreadyExists: $translate.instant('USERS.ERROR.ALREADY_EXISTS'),
            errorMessage: $translate.instant('USERS.ERROR.UPDATION_FAIL')
          };

          var validData = persistData.validifyData(result, customInfo);

          if (Object.keys(validData).length !== 0) {
            vm.dtInstance.reloadData(null, false);
            if (persistData.isValid($scope.user.userImage) && $scope.user.userImage !== userInfo.c_image) {
              utilityFunctions.uploadImage({
                imageDataUri: $scope.user.userImage,
                objectUri: userInfo.objectURI,
                table: vm
              });
            }
          }
        },
        function(error) {
          logReport.error("Edit User Information", JSON.stringify(error));
          toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
        }
      );
    };
  })

  /**
   * Controller to delete tenant user information
   */
  .controller('DeleteTenantUserCtrl', function($scope, $translate, Session, persistData, logReport, toastNotifier, alertNotifier, usersService, userInfo, vm) {
    alertNotifier.clearAlerts();
    $scope.deleteUserMail = userInfo.userMail;
    $scope.deleteUserName = userInfo.userName;

    $scope.deleteUser = function() {
      var deleteData = {
        userToken: Session.token,
        userEmailToDelete: userInfo.userMail
      };

      logReport.info("Delete User Information", JSON.stringify(deleteData));

      usersService.deleteUser(deleteData).
      then(function(result) {
          var customInfo = {
            successMessage: $translate.instant('USERS.SUCCESS.DELETION_SUCCESS'),
            alreadyExists: $translate.instant('USERS.ERROR.ALREADY_EXISTS'),
            errorMessage: $translate.instant('USERS.ERROR.DELETION_FAIL')
          };

          var validData = persistData.validifyData(result, customInfo);

          if (Object.keys(validData).length !== 0) {
            vm.dtInstance.reloadData(null, false);
          }
        },
        function(error) {
          logReport.error("Delete User Information", JSON.stringify(error));
          toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
        }
      );
    };
  });
