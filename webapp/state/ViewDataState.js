sap.ui.define([
	"com/ivancio/zal30-ui5/state/ViewBaseState",
	"com/ivancio/zal30-ui5/service/ViewDataService",
	"com/ivancio/zal30-ui5/constants/constants",
	"com/ivancio/zal30-ui5/model/View"
], function (ViewBaseState, ViewDataService, constants, View) {
	"use strict";

	var oViewDataState = ViewBaseState.extend("com.ivancio.zal30-ui5.state.ViewBaseState", {
		//////////////////////////////////	
		//        Public methods        //	
		//////////////////////////////////	
		constructor: function (oComponent) {
			ViewBaseState.call(this, oComponent);

			// Se instancian los servicios que usaran el modelo
			this._initServices();

			// Se recupera la clase que gestiona los estados de la configuración de la vista
			this._viewConfState = this._oOwnerComponent.getState(this._oOwnerComponent.state.confView);

			// Inicialización del modelo interno
			this._initModel();


		},
		// Determinación del modo de edición según nivel de autorización
		determineEditModebyAuthLevel: function (sViewName) {
			// El nivel de autorización lo marca la información básica obtenida de la vistas leídas. 

			var mViewInfo = this._viewConfState.getViewInfo(sViewName);

			// Si se tiene nivel de autorización "full" entonces tiene permisos para todo. En caso contrario de visualización
			if (mViewInfo.LEVELAUTH == constants.mLevelAuth.full)
				this._editMode = constants.editMode.edit;
			else
				this._editMode = constants.editMode.view;

		},

		// Devuelve si se puede editar la vista
		isViewEditable: function () {
			if (this._editMode == constants.editMode.edit)
				return true;
			else
				return false;
		},

		// Lectura de la configuración y datos
		readConfDataView(mParams, oSuccessHandler, oErrorHandler) {
			var that = this;

			// Nota IRB: Las llamadas se tienen que construir en el propio array. Si se hacen en variables provoca que se llamen de manera inmediata y la recepción
			// del resultado en el promise.all no es correcta, ya que siempre se recibe los datos del primer servicio.			
			var aServices = [this._viewConfState.readView({
				viewName: mParams.viewName,
				fromViewData: true,
				editMode: this._editMode
			}), this.readDataView({
				viewName: mParams.viewName,
				editMode: this._editMode
			})];

			// Si en modo de edición no es de lectura se añade el servicio de bloqueo
			if (this._editMode == constants.editMode.edit) {
				aServices.push(this._oViewDataService.lockView({
					viewName: mParams.viewName
				}));
			}

			Promise.all(aServices).then((result) => {

					// En el registro 0 esta el resultado de la primera llamada
					that._oView = result[0];

					// En el registro 1 esta los datos
					that._oView.setViewDataFromService(result[1].DATA);

					// Si se esta editando hay que mirar el resultado del bloqueo. Si esta bloqueado la tabla no podrá ser editada
					if (that._editMode == constants.editMode.edit)
						that._determineEdtModelAccordingLockView(result[2]);


					// Se ejecuta el código del Success
					oSuccessHandler();

				},
				(error) => {
					oErrorHandler(error);

				});

		},
		// lectura de los datos de la vista
		readDataView: function (mParams) {
			return this._oViewDataService.readData({
				viewName: mParams.viewName,
				editMode: mParams.editMode
			});
		},
		// Se devuelve los datos de cabecera de la vista
		getViewInfo: function () {
			return {
				viewName: this._oView.viewInfo.viewName,
				viewDesc: this._oView.viewInfo.viewDesc
			};
		},
		// Se devuelve las columnas de la tabla a partir del catalogo de campos
		getColumnsTable: function () {
			return (this._oView.getFieldCatalog());
		},
		// Devuelve los datos de la vista
		getViewData() {
			return this._oView.getViewData();
		},
		// Devuelve si la vista ha sido bloqueada
		getViewAlreadyLocked: function () {
			return this._alreadyBlocked;
		},
		// Devuelve el usuario que tiene bloqueado la vista
		getUserAlreadyBlocked: function () {
			return this._lockedByUser;
		},
		// Evento que se lanza cuando un datos de la vista ha sido modificado. Este evento es mixto entre la controladora de la vista
		// que determina donde se ha disparado el evento y aquí, que es el que hace las comprobaciones y validaciones
		// La estructura con los datos modificados tendra los siguientes campos:
		// path, column, value
		onValueCellChanged: function (mParams) {
			// Se inicializa la matriz con los datos de salida
			var mParamsOutput = {
				value: mParams.value
			};
			debugger;

			// Se formatea el campo según la configuración de la columna
			mParamsOutput.value = this._oView.formatterValue(mParams.column, mParams.value);

			return mParamsOutput;
		},
		//////////////////////////////////	
		//        Private methods       //	
		//////////////////////////////////	
		_initServices: function () {
			// Se instancia el servicio de configuraciOn de la vista pasandole: contexto del component necesario para poder acceder
			// al modelo de la aplicacion definido en el manifest
			this._oViewDataService = new ViewDataService(this._oOwnerComponent);

		},
		// Determina el modo de edición dependiendo si la tabla esta bloqueda
		_determineEdtModelAccordingLockView: function (mResult) {
			this._alreadyBlocked = mResult.ALREADYLOCKED;
			this._lockedByUser = mResult.LOCKBYUSER;

			if (this._alreadyBlocked) // Con bloqueo la vista solo se puede visualizar
				this._editMode = constants.editMode.view;
		},
		_initModel: function () {
			// Modo de edición
			this._editMode = '';
			this._alreadyBlocked = false;
			this._lockedByUser = '';
		}
	});
	return oViewDataState;
});
