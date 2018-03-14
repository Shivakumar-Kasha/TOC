/**
 * @Date:   02-21-2017 10:02:53
 * @Project: AssetMonitoring
 * @Last modified time: 2017-10-11T17:23:48+05:30
 * @Copyright: 2017, Kii Corporation www.kii.com
 */

'use strict';

/**
 * Controller to fetch Model information
 */
angular.module('assetManagementApp').controller('ModelsCtrl', function($rootScope, $window, $scope, $uibModal, $compile, $log, $q, $sanitize, Session, USER_ROLES, CONFIG_DATA, AUTH_EVENTS, toastNotifier, alertNotifier, persistData, $translate, dataTable, DTOptionsBuilder, DTColumnBuilder, logReport, modelsService, assetTypeService, sensorService) {

    alertNotifier.clearAlerts();
    var draw = null;
    var vm = this;
    vm.dtInstance = {};
    vm.models = {};
    vm.delete = deleteModel;
    vm.edit = editModel;
    vm.models = {};

    $.fn.dataTable.ext.errMode = 'none';

    $scope.onClick = function(id) {
      var sessionInfo = JSON.parse($window.sessionStorage["sessionInfo"]);
      sessionInfo['ModelId'] = vm.models[id].c_id;
      $window.sessionStorage["sessionInfo"] = JSON.stringify(sessionInfo);
    };
    vm.dtOptions = DTOptionsBuilder.newOptions()
      .withOption('ajax', {
        url: CONFIG_DATA.SERVER_URL + CONFIG_DATA.MODELS.getMethod,
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
          }

          if (persistData.isValid(d.search.value)) {
            var search = {
              key: CONFIG_DATA.SEARCH.models.searchBy,
              value: d.search.value.toLowerCase(),
              filterType: CONFIG_DATA.SEARCH.models.filterType
            };
            d.filter.push(search);
          }

          logReport.info("Get model Query", JSON.stringify(d));

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
            logReport.info("Get Models Information", JSON.stringify(response));
            return response;
          }
        },
        error: function(error) {
          logReport.error("Get Models Information", JSON.stringify(error));
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
      DTColumnBuilder.newColumn(null).renderWith(modelInfoHtml),
      DTColumnBuilder.newColumn(null).notSortable()
      .renderWith(actionsHtml)
    ];

    function createdRow(row, data, dataIndex) {
      // Recompiling so we can bind Angular directive to the DT
      $compile(angular.element(row).contents())($scope);
    }

    function actionsHtml(data, type, full, meta) {
      vm.models[data.id] = data;
      return '<div class="text-center">' +
        // '<button type="button" class="btn btn-warning btn-circle" title="Edit" ng-click="modelsInfo.edit(modelsInfo.models[' + data.id + '])" )"="">' +
        // '   <i class="fa fa-edit"></i>' +
        // '</button>' +
        '<button type="button" class="btn btn-danger btn-circle" title="Delete" ng-click="modelsInfo.delete(modelsInfo.models[' + data.id + '])" )"="" ng-disabled = "{{disableDeleteModelButton}}">' +
        '   <i class="fa fa-trash-o"></i>' +
        '</button>' +
        '</div>';
    }

    if (Session.tenantType === USER_ROLES.tenant) {
      $scope.disableDeleteModelButton = "true";
    }

    function modelInfoHtml(data, type, full, meta) {
      vm.models[data.id] = data;
      return '<a ui-sref="app.model-info"  ng-click="onClick(' + data.id + ')"> ' + $sanitize(data.c_name) + ' </a>';
    }


    // Add Model
    $scope.openAddModelPrompt = function(size) {

      $rootScope.modalInstance = $uibModal.open({
        templateUrl: 'addModelPrompt.html',
        controller: 'AddModelCtrl as showSensors',
        size: 'lg',
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
     * Function to Edit Model
     * @param  {JSON} modelInfo
     */
    function editModel(modelInfo) {
      $rootScope.modalInstance = $uibModal.open({
        templateUrl: 'addModelPrompt.html',
        controller: 'EditModelCtrl',
        backdrop: 'static',
        keyboard: true,
        resolve: {
          modelInfo: function() {
            return modelInfo;
          },
          vm: function() {
            return vm;
          }
        }
      });
    }

    /**
     * Function to delete Model
     * @param  {JSON} modelInfo
     */
    function deleteModel(modelInfo) {
      $rootScope.modalInstance = $uibModal.open({
        templateUrl: 'deleteModelPrompt.html',
        controller: 'DeleteModelCtrl',
        backdrop: 'static',
        keyboard: true,
        resolve: {
          modelInfo: function() {
            return modelInfo;
          },
          vm: function() {
            return vm;
          }
        }
      });
    }
  })

  /**
   * Controller to add model
   */
  .controller('AddModelCtrl', function($rootScope, $scope, $compile, $sanitize, $uibModal, $uibModalInstance, $translate, $q, Session, persistData, dataTable, CONFIG_DATA, AUTH_EVENTS, logReport, toastNotifier, vm, modelsService, DTOptionsBuilder, DTColumnBuilder, assetTypeService, utilityFunctions, alertNotifier) {

    alertNotifier.clearAlerts();
    $scope.Add_or_Update_Model = $translate.instant('CRUD.ADD');
    $scope.Add_or_Update = $translate.instant('BUTTONS.CREATE');
    $scope.mandatory_or_optional = $translate.instant('PLACE_HOLDERS.MANDATORY');
    var draw = null;
    var device = this;
    device.selected = {};
    device.selectAll = false;
    device.toggleAll = toggleAll;
    device.toggleOne = toggleOne;
    device.dtInstance = {};
    device.selectedSensors = {};
    $scope.assetDetails = {};

    var titleHtml = '<label class="checkbox-inline checkbox-custom-alt text-center"><input type="checkbox" ng-model="showSensors.selectAll" ng-click="showSensors.toggleAll(showSensors.selectAll, showSensors.selected)"><i></i></label>';
    $scope.selectedData = [];
    $.fn.dataTable.ext.errMode = 'none';

    device.dtOptions = DTOptionsBuilder.newOptions()
      .withOption('ajax', {
        url: CONFIG_DATA.SERVER_URL + CONFIG_DATA.DEVICES.getMethod,
        type: 'POST',
        data: function(d) {
          draw = d.draw;
          d.userToken = Session.token;
          d.filter = [];
          d.nextPaginationKey = CONFIG_DATA.DATA_TABLE.records + "/" + d.start;

          if (d.order[0].column === 0) {
            d.order = {
              dir: d.order[0].dir,
              column: 'c_name'
            };
          }

          if (persistData.isValid(d.search.value)) {
            var search = {
              key: CONFIG_DATA.SEARCH.device.searchBy,
              value: d.search.value.toLowerCase(),
              filterType: CONFIG_DATA.SEARCH.device.filterType
            };
            d.filter.push(search);
          }

          return JSON.stringify(d);
        },
        headers: CONFIG_DATA.HEADERS,
        beforeSend: function() {
          $rootScope.ajaxloading = true;
        },
        complete: function() {
          $rootScope.ajaxloading = false;
          $rootScope.$apply();
        },
        dataType: "json",
        converters: {
          "text json": function(result) {
            var response = dataTable.filterData(result, draw);
            logReport.info("Get Devices For model", JSON.stringify(response));
            device.selected = [];
            device.selectAll = (response.data.length > 0);
            angular.forEach(response.data, function(data, key) {
              var index = $scope.selectedData.indexOf(data.c_id);
              if (index < 0) {
                device.selectAll = false;
              }
            });
            return response;
          }
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
      .withOption('responsive', false)
      .withOption('createdRow', createdRow)
      .withOption('headerCallback', function(header) {
        if (!device.headerCompiled) {
          // Use this headerCompiled field to only compile header once
          device.headerCompiled = true;
          $compile(angular.element(header).contents())($scope);
        }
      })
      .withOption('language', {
        searchPlaceholder: 'Enter Device Name'
      })
      .withOption('serverSide', true);

    device.dtColumns = [
      DTColumnBuilder.newColumn('c_name'),
      DTColumnBuilder.newColumn('units'),
      DTColumnBuilder.newColumn(null).withTitle(titleHtml).notSortable()
      .renderWith(function(data, type, full, meta) {
        device.selected[full.id] = false;
        device.selectedSensors[data.id] = data;
        var index = $scope.selectedData.indexOf(data.c_id);
        if (index > -1) {
          device.selected[data.id] = true;
        }
        return '<label class="checkbox-inline checkbox-custom-alt text-center"><input type="checkbox" ng-model="showSensors.selected[' + data.id + ']" ng-click="showSensors.toggleOne(showSensors.selected)"><i></i></label>';
      }),
    ];


    function toggleAll(selectAll, selectedItems) {
      for (var id in selectedItems) {
        if (selectedItems.hasOwnProperty(id)) {
          selectedItems[id] = selectAll;
        }
      }
      var data = device.selected;
      angular.forEach(data, function(value, key) {
        if (data[key] === true) {
          var index = $scope.selectedData.indexOf(device.selectedSensors[key].c_id);
          if (index < 0) {
            $scope.selectedData.push(device.selectedSensors[key].c_id);
          }
        } else {
          var index = $scope.selectedData.indexOf(device.selectedSensors[key].c_id);
          if (index > -1) {
            $scope.selectedData.splice(index, 1);
          }
        }
      });
    }

    function toggleOne(selectedItems) {
      // console.log(JSON.stringify(selectedItems));
      var data = device.selected;
      angular.forEach(data, function(value, key) {
        if (data[key] === true) {
          var index = $scope.selectedData.indexOf(device.selectedSensors[key].c_id);
          if (index < 0) {
            $scope.selectedData.push(device.selectedSensors[key].c_id);
          }
        } else {
          var index = $scope.selectedData.indexOf(device.selectedSensors[key].c_id);
          if (index > -1) {
            $scope.selectedData.splice(index, 1);
          }
        }
      });
      for (var id in selectedItems) {
        if (selectedItems.hasOwnProperty(id)) {
          if (!selectedItems[id]) {
            device.selectAll = false;
            return;
          }
        }
      }
      device.selectAll = true;
    }

    function createdRow(row, data, dataIndex) {
      // Recompiling so we can bind Angular directive to the DT
      $compile(angular.element(row).contents())($scope);
    }

    //Model Properties
    angular.extend($scope, {
      template: {
        form: {}
      },
      keys: [0],
      max_model_properties: CONFIG_DATA.MAX_MODEL_PROPERTIES
    });

    $scope.addKey = function() {
      console.log("$scope.keys.length:", ($scope.keys.length));
      console.log("$scope.max_model_properties:", ($scope.max_model_properties));

      if ($scope.keys.length >= $scope.max_model_properties) {
        return false;
      }
      var newItemNo = $scope.keys[$scope.keys.length - 1] + 1;
      console.log("newItemNo:", (newItemNo));
      $scope.keys.push(newItemNo);

      //$scope.template[key[newItemNo-1].id].type="string";
    };

    $scope.removeKey = function(removeItemKey) {
      var lastItem = $scope.keys.length - 1;
      if (lastItem > 0) {
        var tempKey = [];
        for (var ind = 0; ind < $scope.keys.length; ind++) {
          if ($scope.keys[ind] !== removeItemKey) {
            tempKey[tempKey.length] = $scope.keys[ind];
          }
        }
        $scope.keys = tempKey;
        delete $scope.template.form[removeItemKey];
      }
    };

    //copy Device Property Label to Id

    $scope.copyPropertyLabel = function(propertyID, propertyKey) {
      var lastItem = $scope.keys.length - 0;
      if (lastItem > 0) {
        var tempKey = [];
        for (var ind = 0; ind < $scope.keys.length; ind++) {
          if ($scope.keys[ind] !== propertyKey) {
            tempKey[tempKey.length] = $scope.keys[ind];
          }
        }
        var propertyIdToDisplay = propertyID.toLowerCase();
        var property = "";
        property = propertyIdToDisplay.replace(/[^A-Z0-9 ]/ig, "");
        propertyIdToDisplay = property.replace(/\s+/g, "-");
        $scope.template.form[propertyKey].propertyId = propertyIdToDisplay.trim();
      }
    }

    $scope.submit = function() {
      console.log("submit:");

      var data = device.selected;
      var details = [];
      angular.forEach($scope.selectedData, function(value, key) {
        details.push(value);
      });
      // angular.forEach(data, function(value, key) {
      //   if (data[key] === true) {
      //     var sensorInfo = sensor.selectedSensors[key];
      //     var sensorDetails = sensorInfo.c_id;
      //     details.push(sensorDetails);
      //   }
      // });
      logReport.info("Model Information" + JSON.stringify(details));

      var modelInfo = {
        c_name: $scope.template.modelName,
        devices: details
      };

      var modelDataInfo = {
        userToken: Session.token,
        modelData: modelInfo
      };
      logReport.info("Model Data Information", JSON.stringify(modelDataInfo));
      var modelProperties = [];
      angular.forEach($scope.keys, function(key) {
        var required = "";

        var hint = "";
        if (persistData.isValid($scope.template.form[key].required)) {
          required = true;
        } else {
          required = false;
        }
        if (persistData.isValid($scope.template.form[key].hint)) {
          hint = $scope.template.form[key].hint;
        } else {
          hint = "";
        }
        var label = $scope.template.form[key].label;
        modelProperties.push({
          label: $scope.template.form[key].label,
          internal_name: $scope.template.form[key].propertyId,
          type: $scope.template.form[key].type,
          hint: hint,
          required: required
        });
      });

      var data = modelDataInfo.modelData;
      data.customProperties = modelProperties;
      var inputInfo = {
        userToken: Session.token,
        modelData: data
      };

      logReport.info("Input For Adding Model with properties" + JSON.stringify(inputInfo));
      modelsService.addModel(inputInfo).then(function(result) {
          var customInfo = {
            successMessage: $translate.instant('MODELS.SUCCESS.CREATION_SUCCESS'),
            alreadyExists: $translate.instant('MODELS.ERROR.ALREADY_EXISTS'),
            errorMessage: $translate.instant('MODELS.ERROR.CREATION_FAIL')
          };
          var validData = persistData.validifyData(result, customInfo);
          if (Object.keys(validData).length !== 0) {
            vm.dtInstance.reloadData(null, false);
          }
        },
        function(error) {
          logReport.error("Add Model Information", JSON.stringify(error));
          toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
        }
      );
    };
    $scope.cancel = function() {
      $uibModalInstance.dismiss('cancel');
    };
  })

  /**
   * Controller to delete Model
   */
  .controller('DeleteModelCtrl', function($scope, $rootScope, $translate, Session, persistData, logReport, toastNotifier, modelsService, modelInfo, vm) {

    $scope.deleteModelName = modelInfo.c_name;

    function deleteModels() {
      var deleteData = {
        userToken: Session.token,
        c_id: modelInfo.c_id
      };
      logReport.info("Delete Model Information", JSON.stringify(deleteData));
      modelsService.deleteModel(deleteData).
      then(function(result) {
          var customInfo = {
            successMessage: '',
            alreadyExists: '',
            errorMessage: $translate.instant('MODELS.ERROR.DELETION_FAIL')
          };

          var validData = persistData.validifyData(result, customInfo);
          var recordExists = validData.data.recordsExists;
          if (Object.keys(validData).length !== 0) {
            vm.dtInstance.reloadData(null, false);
          }
          if (recordExists === 0) {
            toastNotifier.showSuccess($translate.instant('MODELS.SUCCESS.DELETION_SUCCESS'));
            vm.dtInstance.reloadData(null, false);
            $rootScope.modalInstance.close();
          } else {
            deleteModels();
          }
        },
        function(error) {
          logReport.error("Delete Model Information", JSON.stringify(error));
          toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
        }
      );
    }
    $scope.deleteModel = function() {

      deleteModels();
    };

  });
