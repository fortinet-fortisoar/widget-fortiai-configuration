/* Copyright start
  MIT License
  Copyright (c) 2024 Fortinet Inc
  Copyright end */
    'use strict';
    (function () {
        angular
            .module('cybersponse')
            .controller('fortiAIConfiguration100Ctrl', fortiAIConfiguration100Ctrl);

        fortiAIConfiguration100Ctrl.$inject = ['$scope', '$rootScope', 'fortiAiConfigService', 'toaster', 'WizardHandler', '$window', '_', 'currentPermissionsService', 'connectorService', 'CommonUtils', '$controller', 'widgetBasePath'];

        function fortiAIConfiguration100Ctrl($scope, $rootScope, fortiAiConfigService, toaster, WizardHandler, $window, _, currentPermissionsService, connectorService, CommonUtils, $controller, widgetBasePath) {
          $controller('BaseConnectorCtrl', {
            $scope: $scope
          });
          $scope.entity = {};
          $scope.keyStoreValue = {};
          $scope.llmIntegrationData = {};
          $scope.moveNext = moveNext;
          $scope.moveBack = moveBack;
          $scope.loadConnectorPage = loadConnectorPage;
          $scope.updateLLMIntegrationData = updateLLMIntegrationData;
          $scope.saveConnector = saveConnector;
          $scope.defaultLLMIntegration = {};
          $scope.isLightTheme = $rootScope.theme.id === 'light';
          $scope.startInfoGraphics = $scope.isLightTheme ? widgetBasePath +'images/fortiAI-start-light.png': widgetBasePath +'images/fortiAI-start-dark.png';
          $scope.connectLLMInfoGraphics = $scope.isLightTheme ? widgetBasePath +'images/fortiAI-connect-llm-light.png': widgetBasePath +'images/fortiAI-connect-llm-dark.png';

          init()
          function init() {
            $scope.llmIntegrationData = fortiAiConfigService.constants();
            $scope.defaultLLMIntegration = $scope.llmIntegrationData.defaultLLMIntegration
            fortiAiConfigService.getKeyStoreRecord($scope.llmIntegrationData.queryForKeyStore, 'keys').then(function (response) {
              if (response['hydra:member'] && (response['hydra:member'][0])) {
                $scope.entity = response;
                $scope.keyStoreValue = $scope.entity['hydra:member'][0].jSONValue;
              }
              else {
                toaster.error({ body: "Key Store record not found, refer documentation" });
              }
            })
          }

          function moveNext() {
            var currentStepTitle = WizardHandler.wizard('fortiAIConfiguration').currentStep().wzTitle
            if (currentStepTitle === 'Start') {
              updateLLMIntegrationData('load');
            }
            if (currentStepTitle === 'Finish') {
              fortiAiConfigService.updateConfigurationRecord($scope.keyStoreValue, $scope.entity['hydra:member'][0].uuid);
            }
            WizardHandler.wizard('fortiAIConfiguration').next();
          }

          function loadConnectorPage() {
            updateKeyStoreValue();
            fortiAiConfigService.loadConnectorData($scope.keyStoreValue.llmIntegrationToUse).then(function(selectedConnector) { 
              $scope.selectedConnector = selectedConnector;
              $scope.loadConnector($scope.selectedConnector, false, false);
              WizardHandler.wizard('fortiAIConfiguration').next(); 
            });
          }

          function saveConnector(saveFrom) {
            $scope.isConnectorConfigured = true;
            $scope.configuredConnector = false;
            var data = angular.copy($scope.connector);
            if (CommonUtils.isUndefined(data)) {
              $scope.statusChanged = false;
              return;
            }
            if (!currentPermissionsService.availablePermission('connectors', 'update')) {
              $scope.statusChanged = false;
              return;
            }
      
            var newConfiguration, newConfig, deleteConfig;
            newConfiguration = false;
            if (saveFrom !== 'deleteConfigAndSave') {
              if (!_.isEmpty($scope.connector.config_schema)) {
                if (!$scope.validateConfigurationForm()) {
                  return;
                }
              }
              if (!$scope.input.selectedConfiguration.id) {
                newConfiguration = true;
                $scope.input.selectedConfiguration.config_id = $window.UUID.generate();
                if ($scope.input.selectedConfiguration.default) {
                  angular.forEach(data.configuration, function (configuration) {
                    if (configuration.config_id !== $scope.input.selectedConfiguration.config_id) {
                      configuration.default = false;
                    }
                  });
                }
                data.configuration.push($scope.input.selectedConfiguration);
                newConfig = $scope.input.selectedConfiguration;
              }
              delete data.newConfig;
            }
      
            if (saveFrom === 'deleteConfigAndSave') {
              $scope.isConnectorConfigured = false;
              deleteConfig = true;
              $scope.isConnectorHealthy = false;
            }
      
            var updateData = {
              connector: data.id,
              name: $scope.input.selectedConfiguration.name,
              config_id: $scope.input.selectedConfiguration.config_id,
              id: $scope.input.selectedConfiguration.id,
              default: $scope.input.selectedConfiguration.default,
              config: {},
              teams: $scope.input.selectedConfiguration.teams
            };
            $scope.saveValues($scope.input.selectedConfiguration.fields, updateData.config);
            $scope.processing = true;
            connectorService.updateConnectorConfig(updateData, newConfiguration, deleteConfig).then(function (response) {
              if (newConfig) {
                $scope.connector.configuration.push(newConfig);
                if (newConfig.default) {
                  $scope.removeDefaultFromOthers();
                }
      
              }
              $scope.formHolder.connectorForm.$setPristine();
              if (!deleteConfig) {
                $scope.input.selectedConfiguration.id = response.id;
                $scope.configuredConnector = true;
                $scope.isConnectorHealthy = true;
              }
              $scope.checkHealth();
              $scope.statusChanged = false;
            }, function (error) {
              toaster.error({
                body: error.data.message ? error.data.message : error.data['hydra:description']
              });
            }).finally(function () {
              $scope.processing = false;
            });
          }

          function updateLLMIntegrationData(action) {
            var llmIntegrationToUse;
            var llMIntegrationDict;
        
            if (action === 'load') {
                llmIntegrationToUse = $scope.keyStoreValue.llmIntegrationToUse;
                llMIntegrationDict = $scope.keyStoreValue.llmIntegrations.find(integration => integration.name === llmIntegrationToUse);
                if ($scope.keyStoreValue.llmIntegrationData[llmIntegrationToUse] === undefined) {
                  $scope.keyStoreValue.llmIntegrationData[llmIntegrationToUse] = {"conversationModel":"", "pBGenerationModel":"", "isMultiConfigAvailable": false}
                }
                $scope.defaultLLMIntegration.conversationModel = $scope.keyStoreValue.llmIntegrationData[llmIntegrationToUse].conversationModel
                $scope.defaultLLMIntegration.pBGenerationModel = $scope.keyStoreValue.llmIntegrationData[llmIntegrationToUse].pBGenerationModel
                $scope.defaultLLMIntegration.isMultiConfigAvailable = $scope.keyStoreValue.llmIntegrationData[llmIntegrationToUse].isMultiConfigAvailable
            } else if (action === 'set') {
                llmIntegrationToUse = $scope.defaultLLMIntegration.title;
                llMIntegrationDict = $scope.keyStoreValue.llmIntegrations.find(integration => integration.title === llmIntegrationToUse);
                if ($scope.keyStoreValue.llmIntegrationData[llMIntegrationDict.name] === undefined) {
                  $scope.keyStoreValue.llmIntegrationData[llMIntegrationDict.name] = {"conversationModel":"", "pBGenerationModel":"", "isMultiConfigAvailable": false}
                }
                $scope.defaultLLMIntegration.conversationModel = $scope.keyStoreValue.llmIntegrationData[llMIntegrationDict.name].conversationModel
                $scope.defaultLLMIntegration.pBGenerationModel = $scope.keyStoreValue.llmIntegrationData[llMIntegrationDict.name].pBGenerationModel
                $scope.defaultLLMIntegration.isMultiConfigAvailable = $scope.keyStoreValue.llmIntegrationData[llMIntegrationDict.name].isMultiConfigAvailable
            }
            $scope.defaultLLMIntegration.title = llMIntegrationDict.title;
            $scope.defaultLLMIntegration.name = llMIntegrationDict.name;
            $scope.defaultLLMIntegration.modelList = llMIntegrationDict.modelList;
            $scope.defaultLLMIntegration.llmIntegrationsList = $scope.keyStoreValue.llmIntegrations.map(item => item.title);
          }
        
          function updateKeyStoreValue() {
            var llmIntegrationToUse = $scope.defaultLLMIntegration.name;
            var llmIntegrationDict = $scope.keyStoreValue.llmIntegrationData[llmIntegrationToUse];
            $scope.keyStoreValue.llmIntegrationToUse = llmIntegrationToUse;
            llmIntegrationDict.conversationModel = $scope.defaultLLMIntegration.conversationModel;
            llmIntegrationDict.pBGenerationModel = $scope.defaultLLMIntegration.pBGenerationModel;
            llmIntegrationDict.isMultiConfigAvailable = $scope.defaultLLMIntegration.isMultiConfigAvailable;
            $scope.keyStoreValue.llmIntegrationData[llmIntegrationToUse] = llmIntegrationDict;
          }

          function moveBack() {
            WizardHandler.wizard('fortiAIConfiguration').previous();
          }
        }
    })();
