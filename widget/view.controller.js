/* Copyright start
  MIT License
  Copyright (c) 2024 Fortinet Inc
  Copyright end */
  'use strict';
  (function () {
    angular
      .module('cybersponse')
      .controller('fortiAIConfiguration300Ctrl', fortiAIConfiguration300Ctrl);
  
    fortiAIConfiguration300Ctrl.$inject = ['$scope', '$rootScope', 'fortiAiConfigService', 'toaster', 'WizardHandler', '$window', '_', 'currentPermissionsService', 'connectorService', 'CommonUtils', '$controller', 'widgetBasePath', 'fileService'];
  
    function fortiAIConfiguration300Ctrl($scope, $rootScope, fortiAiConfigService, toaster, WizardHandler, $window, _, currentPermissionsService, connectorService, CommonUtils, $controller, widgetBasePath, fileService) {
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
      $scope.loadAssistantPage = loadAssistantPage;
      $scope.createUpdateAssistant = createUpdateAssistant;
      $scope.formUpdate = formUpdate;
      $scope.defaultLLMIntegration = {};
      $scope.isLightTheme = $rootScope.theme.id === 'light';
      $scope.startInfoGraphics = $scope.isLightTheme ? widgetBasePath + 'images/fortiAI-start-light.png' : widgetBasePath + 'images/fortiAI-start-dark.png';
      $scope.connectLLMInfoGraphics = $scope.isLightTheme ? widgetBasePath + 'images/fortiAI-connect-llm-light.png' : widgetBasePath + 'images/fortiAI-connect-llm-dark.png';
      $scope.createAssistantGraphics = $scope.isLightTheme ? + widgetBasePath + 'images/fortiai-create-assistant-light.png' : widgetBasePath + 'images/fortiai-create-assistant-dark.png';
      $scope.widgetCSS = widgetBasePath + 'assets/fortiAiConfig.css';
      $scope.assistantStatus = 'Create'; 
      var attachmentData = '',soc_json_data = '', pb_instruction = '';
      var soc_assistant_id = '' , playbook_assistant_id = '';
      $scope.createUpdateActionClicked = false;
      $scope.openAIAssitant = {};
      init();
  
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
        fortiAiConfigService.loadConnectorData($scope.keyStoreValue.llmIntegrationToUse).then(function (selectedConnector) {
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
            $scope.keyStoreValue.llmIntegrationData[llmIntegrationToUse] = { "conversationModel": "", "pBGenerationModel": "", "isMultiConfigAvailable": false }
          }
          $scope.defaultLLMIntegration.conversationModel = $scope.keyStoreValue.llmIntegrationData[llmIntegrationToUse].conversationModel
          $scope.defaultLLMIntegration.pBGenerationModel = $scope.keyStoreValue.llmIntegrationData[llmIntegrationToUse].pBGenerationModel
          $scope.defaultLLMIntegration.isMultiConfigAvailable = $scope.keyStoreValue.llmIntegrationData[llmIntegrationToUse].isMultiConfigAvailable
        } else if (action === 'set') {
          llmIntegrationToUse = $scope.defaultLLMIntegration.title;
          llMIntegrationDict = $scope.keyStoreValue.llmIntegrations.find(integration => integration.title === llmIntegrationToUse);
          if ($scope.keyStoreValue.llmIntegrationData[llMIntegrationDict.name] === undefined) {
            $scope.keyStoreValue.llmIntegrationData[llMIntegrationDict.name] = { "conversationModel": "", "pBGenerationModel": "", "isMultiConfigAvailable": false }
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
  
      //load step4 - create assistant page
      function loadAssistantPage() {
        $scope.projectId = "proj_4chZohs0W0VUeubUcZk5vIsD"; //default project id given
        $scope.openAIAssitant['playbookAssistantName'] = "";
        $scope.openAIAssitant['socAssistantName'] = "";
        $scope.assistantCreated = false;
        $scope.config_name = $scope.input.selectedConfiguration.config_id;
        loadAttachmentData();
        getAssistantIds();
        WizardHandler.wizard('fortiAIConfiguration').next();
      }
  
      //to enable/disable button when change in text
      function formUpdate(){
        $scope.assistantCreated = false;
      }
  
      //load file instruction for soc assistant from attachment module
      function loadAttachmentData(){
        fortiAiConfigService.getAttachmentRecord($scope.llmIntegrationData.queryForAttachment,'attachments').then(function (response) {
          if (response['hydra:member'] && (response['hydra:member'][0])) {
            var fileId = response['hydra:member'][0]['file']['id'];
            fileService.getFile(fileId).then(function(response){
              attachmentData = response.data;
              console.log(attachmentData);
            })
          }
          else {
            toaster.error({ body: "Attachment record not found." });
          }
        });
        fortiAiConfigService.executeAction('aiassistant-utils', 'get_assistants_data', $scope.config_name).then(function (assistantData) {
          if(assistantData && assistantData.data){
            soc_json_data = assistantData.data.soc_assistant_json;
            pb_instruction = assistantData.data.playbook_assistant_instruction;
          }
        }, function (error) {
          console.log(error)
        });
      }
  
   
      // check if assistant ids are already present
      function getAssistantIds(){
        var config_name = $scope.input.selectedConfiguration.config_id;
        var payload = { genai_type: 'OpenAI' };
        fortiAiConfigService.executeAction('aiassistant-utils', 'get_assistant_ids',null, payload)
        .then(function (response) {
          if (response) {
            if(response.data !== null && (response.data.soc_assistant_id !== '' || response.data.playbook_assistant_id !== '')){
              $scope.assistantStatus = 'Update';
  
              var socId_payload = { assistant_id: response.data.soc_assistant_id}; 
              soc_assistant_id = response.data.soc_assistant_id;
              const soc_name_promise = fortiAiConfigService.executeAction('openai', 'get_assistant', config_name, socId_payload).then(function (soc_response) {
                return soc_response;
              });
              var pbId_payload = {assistant_id: response.data.playbook_assistant_id};
              playbook_assistant_id = response.data.playbook_assistant_id;
              const pb_name_promise = fortiAiConfigService.executeAction('openai', 'get_assistant', config_name, pbId_payload).then(function (pb_response) {
                return pb_response;
              });
              Promise.all([soc_name_promise, pb_name_promise]).then((responses) => {
                if (responses) {
                  $scope.openAIAssitant.socAssistantName = responses[0].data.name;
                  $scope.openAIAssitant.playbookAssistantName = responses[1].data.name;
  
                  //updateAssistant();
                }
              }).catch((error) => {
                console.log(error);
              })
            }
            else{
              $scope.assistantStatus = 'Create';
              //createAssistant();
            }
          }
        }, function (error) {
          console.log(error)
        });
      }
  
      function createUpdateAssistant(){
        $scope.createUpdateActionClicked = true;
        if($scope.assistantStatus === 'Create'){
          createAssistant();
        }
        else{
          updateAssistant();
        }
      }
  
      //call create_assistant from openaicand then save the assistant ids in assistant utils 
      function createAssistant() {
        var pb_payload = {
          model: $scope.defaultLLMIntegration.pBGenerationModel,
          description: 'playbook',
          instructions: JSON.stringify(pb_instruction).replace("\"",'\''), //playbook instructions
          name: $scope.openAIAssitant.playbookAssistantName, //ui-pb-assistant,
        }
        var config_name = $scope.input.selectedConfiguration.config_id;
        const pb_promise = fortiAiConfigService.executeAction('openai', 'create_assistant', config_name, pb_payload).then(function (pb_response) {
          //console.log(pb_response);
          return pb_response;
        });
  
        var soc_payload = {
          model: $scope.defaultLLMIntegration.pBGenerationModel,
          description: 'soc',
          instructions: JSON.stringify(attachmentData), //txt file content
          tools: soc_json_data, //josn
          name: $scope.openAIAssitant.socAssistantName, //ui-soc-assistant,
        }
        const soc_promise = fortiAiConfigService.executeAction('openai', 'create_assistant', config_name, soc_payload).then(function (soc_response) {
          //console.log(soc_response);
          return soc_response;
        });
  
        Promise.all([pb_promise, soc_promise]).then((responses) => {
          if (responses) {
            saveAssistants(responses);
          }
        }).catch((error) => {
          console.log(error);
        })
      }
  
      function updateAssistant(){
        var pb_payload = {
          assistant_id: playbook_assistant_id,
          model: $scope.defaultLLMIntegration.pBGenerationModel,
          description: 'playbook',
          instructions: JSON.stringify(pb_instruction).replace("\"",'\''), //playbook instructions
          name: $scope.openAIAssitant.playbookAssistantName, //ui-pb-assistant,
        }
        var config_name = $scope.input.selectedConfiguration.config_id;
        const pb_promise = fortiAiConfigService.executeAction('openai', 'update_assistant', config_name, pb_payload).then(function (pb_response) {
          //console.log(pb_response);
          return pb_response;
        });
  
        var soc_payload = {
          assistant_id: soc_assistant_id,
          model: $scope.defaultLLMIntegration.pBGenerationModel,
          description: 'soc',
          instructions: JSON.stringify(attachmentData), //txt file content
          tools: soc_json_data, //josn
          name: $scope.openAIAssitant.socAssistantName, //ui-soc-assistant,
        }
        const soc_promise = fortiAiConfigService.executeAction('openai', 'update_assistant', config_name, soc_payload).then(function (soc_response) {
          //console.log(soc_response);
          return soc_response;
        });
  
        Promise.all([pb_promise, soc_promise]).then((responses) => {
          if (responses) {
            saveAssistants(responses);
          }
        }).catch((error) => {
          console.log(error);
        })
      }
       
      function saveAssistants(responses) {
        var playbook_id = '', soc_id = '';
        responses.forEach(element => {
          if (element['data']['description'] === 'playbook') {
            playbook_id = element['data']['id'];
          }
          else {
            soc_id = element['data']['id'];
          }
        });
        var _payload = {
          genai_type: 'OpenAI',
          assistant_ids: { 'soc_assistant_id': soc_id, 'playbook_assistant_id': playbook_id }
        }
        var config_name = $scope.input.selectedConfiguration.config_id;
        fortiAiConfigService.executeAction('aiassistant-utils', 'set_assistant_ids', config_name, _payload).then(function (data) {
          if (data && data.status === 'Success') {
            $scope.createUpdateActionClicked = false;
            $scope.assistantCreated = true;
          }
        }, function (error) {
          console.log(error)
        })
      }
  
      function moveBack() {
        WizardHandler.wizard('fortiAIConfiguration').previous();
      }
    }
  })();
