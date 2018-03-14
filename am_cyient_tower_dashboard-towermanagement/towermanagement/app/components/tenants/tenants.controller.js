/**
 * @Date:   01-27-2017 12:01:21
 * @Project: AssetMonitoring
 * @Last modified time: 08-23-2017 18:08:52
 * @Copyright: 2017, Kii Corporation www.kii.com
 */

'use strict';

/**
 * Controller to fetch tenants information
 */
angular.module('assetManagementApp').controller('TenantsCtrl', function($rootScope, $scope, $uibModal, $translate, $compile, Session, CONFIG_DATA, DTOptionsBuilder, DTColumnBuilder, persistData, tenantsService, logReport, toastNotifier, alertNotifier, dataTable) {
    alertNotifier.clearAlerts();
    var draw = null;
    var vm = this;
    vm.dtInstance = {};
    vm.tenants = {};
    vm.editTenant = editTenant;
    vm.deleteTenant = deleteTenant;

    vm.dtOptions = DTOptionsBuilder.newOptions()
      .withOption('ajax', {
        url: CONFIG_DATA.SERVER_URL + CONFIG_DATA.TENANTS.getMethod,
        type: 'POST',
        data: function(d) {
          draw = d.draw;
          d.userToken = Session.token;
          d.nextPaginationKey = CONFIG_DATA.DATA_TABLE.records + "/" + d.start;
          d.filter = [];

          if (d.order[0].column === 0) {
            d.order = {
              dir: d.order[0].dir,
              column: 'c_name'
            };
          } else if (d.order[0].column === 1) {
            d.order = {
              dir: d.order[0].dir,
              column: 'userMail'
            };
          }

          if (persistData.isValid(d.search.value)) {
            var search = {
              key: CONFIG_DATA.SEARCH.tenants.searchBy,
              value: d.search.value.toLowerCase(),
              filterType: CONFIG_DATA.SEARCH.tenants.filterType
            };
            d.filter.push(search);
          }

          logReport.info("Get Tenant Query", JSON.stringify(d));

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
            logReport.info("Get Tenant Information", JSON.stringify(response));
            return response;
          }
        },
        error: function(error) {
          logReport.error("Get Tenant Information", JSON.stringify(error));
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
        searchPlaceholder: $translate.instant('PLACE_HOLDERS.ENTER_NAME')
      })
      .withOption('serverSide', true);

    vm.dtColumns = [
      DTColumnBuilder.newColumn('c_name'),
      DTColumnBuilder.newColumn('userMail'),
      DTColumnBuilder.newColumn(null).notSortable()
      .renderWith(actionsHtml)
    ];

    function createdRow(row, data, dataIndex) {
      // Recompiling so we can bind Angular directive to the DT
      $compile(angular.element(row).contents())($scope);
    }

    function actionsHtml(data, type, full, meta) {
      vm.tenants[data.id] = data;
      return '<div class="text-center"><button type="button" class="btn btn-warning btn-circle" title="Edit" ng-click="showCaseTenants.editTenant(showCaseTenants.tenants[' + data.id + '])">' +
        '<i class="fa fa-edit"></i>' +
        '</button>&nbsp;' +
        '<button type="button" class="btn btn-danger btn-circle" title="Delete" ng-click="showCaseTenants.deleteTenant(showCaseTenants.tenants[' + data.id + '])" )"="">' +
        '<i class="fa fa-trash-o"></i>' +
        '</button></div>';
    }

    //Add Tenant Information
    $scope.addTenant = function() {
      $rootScope.modalInstance = $uibModal.open({
        templateUrl: 'addTenantsContent.html',
        controller: 'AddTenantCtrl',
        backdrop: 'static',
        keyboard: true,
        resolve: {
          vm: function() {
            return vm;
          }
        }
      });
    };

    /**
     * Function to edit tenant information
     * @param  {JSON} tenantInfo
     */
    function editTenant(tenantInfo) {

      logReport.info(JSON.stringify(tenantInfo));
      tenantsService.getTenantDetails({
        userToken: Session.token,
        c_id: tenantInfo.c_id
      }).
      then(function(result) {

          var customInfo = {
            successMessage: '',
            alreadyExists: '',
            errorMessage: $translate.instant('TENANTS.ERROR.TENANT_RETRIEVE_FAIL')
          };

          var validData = persistData.validifyData(result, customInfo);
          logReport.info("#######", JSON.stringify(validData))
          if (Object.keys(validData).length !== 0) {
            $rootScope.modalInstance = $uibModal.open({
              templateUrl: 'addTenantsContent.html',
              controller: 'EditTenantCtrl',
              backdrop: 'static',
              keyboard: true,
              resolve: {
                tenantInfo: function() {
                  validData['objectURI'] = tenantInfo.objectURI;
                  return validData;
                },
                vm: function() {
                  return vm;
                }
              }
            });
          }
        },
        function(error) {
          logReport.error("Get Tenant User Information", JSON.stringify(error));
          toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
        }
      );
    }

    /**
     * Function to delete tenant information
     * @param  {JSON} tenantInfo
     */
    function deleteTenant(tenantInfo) {
      $rootScope.modalInstance = $uibModal.open({
        templateUrl: 'deletePrompt.html',
        controller: 'DeleteTenantCtrl',
        backdrop: 'static',
        keyboard: true,
        resolve: {
          tenantInfo: function() {
            return tenantInfo;
          },
          vm: function() {
            return vm;
          }
        }
      });
    }
  })

  /**
   * Controller to add tenant information
   */
  .controller('AddTenantCtrl', function($scope, $translate, Session, REG_EXP, logReport, toastNotifier, utilityFunctions, tenantsService, vm, persistData, alertNotifier) {
    alertNotifier.clearAlerts();
    angular.extend($scope, {
      Add_or_Edit_Tenant: $translate.instant('CRUD.ADD'),
      Add_or_Update: $translate.instant('BUTTONS.CREATE'),
      mandatory_or_optional: $translate.instant('PLACE_HOLDERS.MANDATORY'),
      isPasswordMandatory: true,
      readOnly: "false",
      emailPattern: REG_EXP.email,
      type: "password",
      isGenerateChecked: true,
      tenant: {},
      user: {},
      generateRandomPassword: function() {
        utilityFunctions.generateRandomAlphaNumericString(this, 8);
      },
      hideShowPassword: function() {
        utilityFunctions.showHidePassword(this);
      },
      latLong: {
        latitude: "",
        longitude: ""
      }
    });

    $scope.submitTanantInfo = function() {
      if (utilityFunctions.isValid($scope.tenant.tenantAddress)) {
        utilityFunctions.fetchLatAndLong($scope.tenant.tenantAddress, this);
      } else {
        $scope.latLong = {
          latitude: "",
          longitude: ""
        };
        $scope.submit();
      }
    };

    $scope.submit = function() {
      var data = {
        userToken: Session.token,
        sendMailTo: $scope.user.sendMailTo,
        userPassword: $scope.user.password,
        tenantData: {
          c_name: $scope.tenant.tenantName,
          address: $scope.tenant.tenantAddress,
          latitude: $scope.latLong.latitude,
          longitude: $scope.latLong.longitude,
          firstName: $scope.user.firstName,
          lastName: $scope.user.lastName,
          userMail: $scope.user.username.toLowerCase()
        }
      };

      logReport.info("Add Tenant Information", JSON.stringify(data));

      tenantsService.addTenant(data).then(function(result) {
          var customInfo = {
            successMessage: $translate.instant('TENANTS.SUCCESS.CREATION_SUCCESS'),
            alreadyExists: $translate.instant('TENANTS.ERROR.ALREADY_EXISTS'),
            errorMessage: $translate.instant('TENANTS.ERROR.CREATION_FAIL')
          };

          var validData = persistData.validifyData(result, customInfo);
          logReport.info("@@@@@@@@@@@", JSON.stringify(validData))
          if (Object.keys(validData).length !== 0) {
            if (utilityFunctions.isValid($scope.tenant.c_image)) {
              utilityFunctions.uploadImage({
                imageDataUri: $scope.tenant.c_image,
                objectUri: validData.data.objectURI,
                table: vm
              });
            } else {
              vm.dtInstance.reloadData(null, false);
            }
          }
        },
        function(error) {
          logReport.error("Add Tenant Information", JSON.stringify(error));
          toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
        }
      );
    };
  })

  /**
   * Controller to edit tenant information
   */
  .controller('EditTenantCtrl', function($scope, $translate, Session, REG_EXP, logReport, toastNotifier, utilityFunctions, tenantsService, tenantInfo, vm, persistData, alertNotifier) {
    alertNotifier.clearAlerts();
    angular.extend($scope, {
      Add_or_Edit_Tenant: $translate.instant('CRUD.EDIT'),
      Add_or_Update: $translate.instant('BUTTONS.UPDATE'),
      mandatory_or_optional: $translate.instant('PLACE_HOLDERS.OPTIONAL'),
      isPasswordMandatory: false,
      readOnly: "true",
      emailPattern: REG_EXP.email,
      type: "password",
      isGenerateChecked: false,

      tenant: {
        tenantName: tenantInfo.data.tenantData.c_name,
        tenantAddress: tenantInfo.data.tenantData.address,
        c_image: tenantInfo.data.tenantData.c_image
      },
      user: {
        firstName: tenantInfo.data.userData.firstName,
        lastName: tenantInfo.data.userData.lastName,
        username: tenantInfo.data.tenantData.userMail,
        sendMailTo: tenantInfo.data.tenantData.userMail
      },
      latLong: {
        latitude: "",
        longitude: ""
      },
      generateRandomPassword: function() {
        utilityFunctions.generateRandomAlphaNumericString(this, 8);
      },
      hideShowPassword: function() {
        utilityFunctions.showHidePassword(this);
      }
    });

    $scope.submitTanantInfo = function() {
      if (utilityFunctions.isValid($scope.tenant.tenantAddress)) {
        utilityFunctions.fetchLatAndLong($scope.tenant.tenantAddress, this);
      } else {
        $scope.latLong = {
          latitude: "",
          longitude: ""
        };
        $scope.submit();
      }
    };

    $scope.submit = function() {
      if (!utilityFunctions.isValid($scope.user.password)) {
        $scope.user.sendMailTo = '';
      }

      var data = {
        userToken: Session.token,
        c_id: tenantInfo.data.tenantData.c_id,
        sendMailTo: $scope.user.sendMailTo,
        userPassword: $scope.user.password,
        tenantData: {
          c_name: $scope.tenant.tenantName,
          address: $scope.tenant.tenantAddress,
          latitude: $scope.latLong.latitude,
          longitude: $scope.latLong.longitude,
          firstName: $scope.user.firstName,
          lastName: $scope.user.lastName,
          userMail: $scope.user.username.toLowerCase()
        }
      };

      logReport.info("Edit Tenant Information", JSON.stringify(data));

      tenantsService.updateTenant(data).then(function(result) {
          var customInfo = {
            successMessage: $translate.instant('TENANTS.SUCCESS.UPDATION_SUCCESS'),
            alreadyExists: $translate.instant('TENANTS.ERROR.ALREADY_EXISTS'),
            errorMessage: $translate.instant('TENANTS.ERROR.UPDATION_FAIL')
          };

          var validData = persistData.validifyData(result, customInfo);
          if (Object.keys(validData).length !== 0) {
            if (utilityFunctions.isValid($scope.tenant.c_image) && ($scope.tenant.c_image !== tenantInfo.data.tenantData.c_image)) {
              utilityFunctions.uploadImage({
                imageDataUri: $scope.tenant.c_image,
                objectUri: tenantInfo.objectURI,
                table: vm
              });
            } else {
              vm.dtInstance.reloadData(null, false);
            }
          }
        },
        function(error) {
          logReport.error("Edit Tenant Information", JSON.stringify(error));
          toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
        }
      );
    };
  })

  /**
   * Controller to delete tenant information
   */
  .controller('DeleteTenantCtrl', function($scope, $translate, utilityFunctions, logReport, toastNotifier, tenantsService, tenantInfo, vm, persistData, alertNotifier) {
    alertNotifier.clearAlerts();
    $scope.deleteTenantName = tenantInfo.c_name;
    $scope.deleteTenant = function() {
      tenantsService.deleteTenant(tenantInfo).then(function(result) {
          var customInfo = {
            successMessage: $translate.instant('TENANTS.SUCCESS.DELETION_SUCCESS'),
            alreadyExists: '',
            errorMessage: $translate.instant('TENANTS.ERROR.DELETION_FAIL')
          };

          var validData = persistData.validifyData(result, customInfo);

          if (Object.keys(validData).length !== 0) {
            vm.dtInstance.reloadData(null, false);
          }
        },
        function(error) {
          logReport.error("Delete Tenant Information", JSON.stringify(error));
          toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
        }
      );
    };
  });
