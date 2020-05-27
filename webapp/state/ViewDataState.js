sap.ui.define([
	"com/ivancio/zal30-ui5/state/ViewBaseState",
	"com/ivancio/zal30-ui5/service/ViewDataService",
	"com/ivancio/zal30-ui5/constants/constants",
	"sap/m/MessageToast",
	"com/ivancio/zal30-ui5/model/viewModel"
], function (ViewBaseState, ViewDataService, constants, MessageToast, viewModel) {
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

		// Devuelve si se puede editar la vista
		isViewEditable: function () {
			if (this._oView.getEditMode() == constants.editMode.edit)
				return true;
			else
				return false;
		},

		// Lectura de la configuración y datos
		processReadConfDataView(mParams, oSuccessHandler, oErrorHandler) {
			var that = this;

			// Se instancia el objeto que gestionara datos y catlaogo de campos
			this._oView = this._instanceViewModelObject(mParams.viewName);

			// Determinación del modo de edición segun el nivel de autorización
			this._determineEditModeByLevelAuth(mParams.viewName);

			if (this._oView.getEditMode() == constants.editMode.edit) {
				this._oViewDataService.lockView({
					viewName: mParams.viewName
				}).then((result) => {

						// Se determina como se edita según el resultado
						that._determineEdtModelAccordingLockView(result.data);

						// Y ahora la funcion que lee la configuración y datos
						that._readConfDataView(mParams, oSuccessHandler, oErrorHandler);
					},
					(error) => {

					});
			} else {
				// Si se esta en modo lectura se leen los datos directamente
				this._readConfDataView(mParams, oSuccessHandler, oErrorHandler);
			}

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
				viewName: this._oView.getViewInfo().VIEWNAME,
				viewDesc: this._oView.getViewInfo().VIEWDESC,
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
			return this._oView.getAlreadyBlocked();
		},
		// Devuelve el usuario que tiene bloqueado la vista
		getUserAlreadyBlocked: function () {
			return this._oView.getLockedByUser();
		},
		// Evento que se lanza cuando un datos de la vista ha sido modificado. Este evento es mixto entre la controladora de la vista
		// que determina donde se ha disparado el evento y aquí, que es el que hace las comprobaciones y validaciones
		// La estructura con los datos modificados tendra los siguientes campos:
		// path, column, value
		onValueCellChanged: function (mParams) {
			var that = this;
			// Se inicializa la matriz con los datos de salida
			var mParamsOutput = {
				value: mParams.value
			};

			// Se quitan cáracteres extraños o no validos. Ejemplo, en los campos númericos que no se pueda poner carácteres que no sea numéros o separador de miles o decimal.
			mParamsOutput.value = this._oView.replaceStrangeChar(mParams.column, mParams.value);

			// Se quita el formato que tiene el campo, necesario para poder grabar en el modelo y luego comparar si los datos han cambiado
			mParamsOutput.value = this._oView.ParseValue(mParams.column, mParamsOutput.value);

			// Se guarda el valor en el modelo propio. Realmente este paso es necesario por dos motivos:
			// 1) Cuando se ponen decimales de más, el campo tiene los decimales correctos pero no en el modelo oData que se guardan de más. Esto luego puede provocar errores al enviar a SAP.
			// 2) Para poder hacer comparaciones entre modelo original y el nuevo. Básico para saber el modo de actualización correcto. Sin el paso anterior hacer la comparación no sería posible			
			this._oView.updateValueModel(mParams.column, mParams.path, mParamsOutput.value);

			// Se informa en que línea se ha hecho el cambio
			this._oView.setRowUpdateIndicator(mParams.path, constants.tableData.fieldUpkzValues.update);

			// Se lanza la validación a nivel de fila
			this._oView.rowValidatePath(mParams.path);


			// La validación en SAP a nivel de fila se hará cuando has cambiado de fila. Es decir, modificas una y luego al modifica otra es cuando se valida en SAP. Esto permite hacer un validación
			// cuando ya has introducido el valor en todos los campos. 			
			if (this._lastPathChanged != '' & this._lastPathChanged != mParams.path) {

				// Proceso de validación a nivel de fila					
				this._rowValidationDeterminationSAP(this._lastPathChanged).then((result) => {
						// Procesos en vista una vez ha finalizado la llamada en SAP
						mParams.handlerPostServiceSAP();
					},
					(error) => {

					});
			} else {
				// Procesos en vista una vez ha finalizado la llamada en SAP
				mParams.handlerPostServiceSAP();
			}

			// Se sobreescribe el path anterior modificado
			this.setLastPathChanged(mParams.path);

			// Se aplica el formato para que pueda ser devuelto y se grabe correctamente en el campo.
			mParamsOutput.value = this._oView.formatterValue(mParams.column, mParamsOutput.value);

			return mParamsOutput;
		},
		// Evento que se lanza cuando se marcan líneas para borrar
		onDeleteEntries: function (aRows, oPostSAPProcess) {
			var that = this;

			// Como se controla que el botón de borrar se habilite solo cuando se seleccionan registros, cuando llega a este método
			// seguro que hay líneas seleccionadas
			for (var x = 0; x < aRows.length; x++) {

				// Si se borra justo la ultima línea modificada se deja el blanco la variable que lo controla. De esta manera no se lanzará el servicio
				// de validación
				if (constants.tableData.path.values + "/" + aRows[x] == this._lastPathChanged)
					this.setLastPathChanged("");

				this._oView.deleteEntry(aRows[x]);
			}

			// Si se ha modificado una fila previamente se lanzará el servicio que valida en SAP dicha fila
			if (this._lastPathChanged != '') {
				this._rowValidationDeterminationSAP(this._lastPathChanged).then((result) => {
						that.setLastPathChanged(""); // Se marca que no hay fila pendiente de validar
						oPostSAPProcess();
					},
					(error) => {

					});
			} else {
				// Si no se llama al servicio de SAP hay que lanzar la función pasada para el refresco de datos en la tabla
				oPostSAPProcess();
			}

		},
		// Devuelve el numero de columnas clave y visible
		getNumberKeyFields: function () {
			return this._oView.getNumberKeyFields();
		},
		// Evento que se produce al añadir una entrada
		onAddEntry: function (oPostSAPProcess) {
			var that = this;
			var aServices = [];

			// Como en ambos procesos luego hay que ajustar los datos de la tabla para no hacer dos veces lo mismo, lo que hago es encadenar ambas llamadas.
			// Para que cuando terminen las dos se ejecute los procesos en pantalla para ajustar sus visualizaciones.

			// Si se ha modificado una fila previamente se lanzará el servicio que valida en SAP dicha fila
			if (this._lastPathChanged != '') {
				aServices.push(this._rowValidationDeterminationSAP(this._lastPathChanged));
			}

			aServices.push(new Promise(function (resolve, reject) {
				var sNewPath = that._oView.addEmptyRow();
				// Se sobreescribe el path anterior modificado
				that.setLastPathChanged(sNewPath);
				resolve();
			}));

			Promise.all(aServices).then((result) => {
					oPostSAPProcess();
				},
				(error) => {
					MessageToast.show(this._oI18nResource.getText("GeneralError"));
				});



		},
		onSaveData: function (sTransportOrder, oPostSAPProcess) {
			var that = this;

			// antes de grabar se evalua si alguna fila pendiente de validar datos en SAP, si es así hay que lanzar el servicio 
			// Y si no hay errores entonces hacer el proceso de grabación

			// Si se ha modificado una fila previamente se lanzará el servicio que valida en SAP dicha fila
			if (this._lastPathChanged != '') {
				this._rowValidationDeterminationSAP(this._lastPathChanged).then((result) => {

						// Si no hay errores en los datos entonces lanzamos la grabación
						if (!that.isDataWithSAPErrors()) {

							// Se llama al proceso de grabación. Si el servicio va bien entonces se lanza la función pasada para
							// el refresco de datos
							that._saveDataSAP(sTransportOrder).then((result) => {

								// Se deja en blanco el último path modificado. Porque la grabación se puede hacer de varios registros. Y guardar el ultimo
								// produce comportamiento erróneos al corregir/editar los datos después de grabarlos.
								that.setLastPathChanged("");

								// Se llama al proceso de la vista una vez se haya ejecutado los pasos de SAP
								oPostSAPProcess(result.return, result.newOrder);

							}, (error) => {

							});
						} else {
							MessageToast.show(this._oI18nResource.getText("ViewData.processSave.tableWithError"));

							// Se llama al proceso de la vista una vez se haya ejecutado los pasos de SAP
							oPostSAPProcess();
						}


					},
					(error) => {
						debugger;
					});
			} else {
				// Si no hay errores en los datos entonces lanzamos la grabación
				if (!that.isDataWithSAPErrors()) {

					// Se llama al proceso de grabación. Si el servicio va bien entonces se lanza la función pasada para
					// el refresco de datos
					that._saveDataSAP(sTransportOrder).then((result) => {
						// Se llama al proceso de la vista una vez se haya ejecutado los pasos de SAP
						oPostSAPProcess(result.return, result.newOrder);
					}, (error) => {

					});
				} else {
					MessageToast.show(this._oI18nResource.getText("ViewData.processSave.tableWithError"));
				}
			}

		},
		// Devuelve si hay registros con errores internos, los generados por la propia aplicacion
		isDataWithInternalErrors: function () {
			return this._oView.isDataWithInternalErrors();

		},
		// Llama al modelo para ver si hay errores procedentes de SAP
		isDataWithSAPErrors: function () {
			return this._oView.isDataWithSAPErrors();
		},
		// Llama al modelo para determinar si los datos han sido modificados
		isDataChanged: function () {
			return this._oView.isDataChanged();
		},
		// Devuelve los mensajes de error de una fila de datos
		getRowStatusMsg: function (sPath) {
			return this._oView.getRowStatusMsg(sPath);
		},
		// Informa el path de la variable que controla que última fila ha sido modificada
		setLastPathChanged: function (sPath) {
			this._lastPathChanged = sPath;
		},
		// Recupera el path de la variable que controla que última fila ha sido modificada
		getLastPathChanged: function () {
			return this._lastPathChanged;
		},
		// Devuelve si se puede transportar en la vista
		getAllowedTransport: function () {
			// Solo se puede transporte si la vista tiene el flag permitido y la vista es editable
			if (this._oView.getViewInfo().ALLOWEDTRANSPORT && this.isViewEditable())
				return true;
			else
				return false;
		},
		// Obtiene las ordenes de transporte del usuario
		getUserOrder: function () {
			var that = this;
			// Se devuelve un promise para simplificar los datos que se devuelven. Así nos ahorramos los paths
			// "basura" que se devuelve
			var oPromise = new Promise(function (resolve, reject) {
				that._oViewDataService.getUserOrder().then((result) => {
					resolve(result.data.results);
				}, (error) => {
					reject(error);
				});

			});

			return oPromise;

		},
		// Chequeo que la orde transporte es correcta
		checkTransportOrder: function (sTransportOrder) {
			var that = this;
			// Se devuelve un promise para simplificar los datos que se devuelven. Así nos ahorramos los paths
			// "basura" que se devuelve
			var oPromise = new Promise(function (resolve, reject) {
				that._oViewDataService.checkTransportOrder(sTransportOrder).then((result) => {
					resolve({
						newOrder: result.data.TRANSPORTORDER,
						message: result.data.MESSAGE
					});
				}, (error) => {
					reject(error);
				});

			});

			return oPromise;
		},
		// Verificación de los datos modificados en SAP
		onCheckDataChangedSAP: function (oPostSAPProcess) {
			// Se extraen los path de los datos modificados
			var aPath = this._oView.getPathModelDataChanged();

			// Lo que se va hacer es aglutinar las llamadas para ejecutar las validaciones una detrás de otra y que la pantalla no se este 
			// ajustando por detras por cada línea modificada
			var aServices = [];

			for (var x = 0; x < aPath.length; x++) {
				aServices.push(this._rowValidationDeterminationSAP(aPath[x]));
			}

			// Se ejecutan los servicios
			Promise.all(aServices).then((result) => {
					oPostSAPProcess();
				},
				(error) => {


				});

		},
		// Proceso que lee los datos auxiliares para el matenimiento de la tabla.  Este método se llamada desde la vista porque
		// según se vayan leyendo los datos se ira ajustado la vista
		//Datos que se leen:
		// 1.- Catalogo de campos que tienen una ayuda para búsqueda
		// 2.- Asociada al punto 1, datos necesarios para la ayuda para búsqueda. Ambos servicios van encadenados, primero el 1 y luego 2.
		getAuxiliaryData: function (oPostProcess) {
			// Se inicia la lectura de las ayudas para búsqueda de los campos que lo permitan. Dentro de este método se hace las llamadas
			// a los datos de los campos
			this._getSearchHelp(oPostProcess.handlerSearchHelp);
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
			this._oView.setAlreadyBlocked(mResult.ALREADYLOCKED);
			this._oView.setLockedByUser(mResult.LOCKBYUSER);

			if (mResult.ALREADYLOCKED) {
				// Con bloqueo la vista solo se puede visualizar
				this._oView.setEditMode(constants.editMode.view);
			}
		},
		_initModel: function () {
			this._lastPathChanged = ''; // Último path modificado
		},
		// Validación de una fila de datos en SAP
		_rowValidationDeterminationSAP: function (sPath) {
			var that = this;

			// La llamada al servicio se incluye en un Promise porque este servicio puede ser encadenado en otras validaciones
			var oPromise = new Promise(function (resolve, reject) {
				that._oViewDataService.rowValidateDetermination(that._oView.getViewInfo().VIEWNAME, JSON.stringify(that._oView.getRowFromPathtoSAP(sPath))).then((result) => {

						// Se actualiza el modelo de datos con el resultado recuperado
						that._oView.updateServiceRow2ModelFromPath(result.data.ROW, sPath);

						resolve();
					},
					(error) => {
						debugger;
						reject(error)
					});
			});
			return oPromise;
		},
		// Grabacion de datos en SAP
		_saveDataSAP: function (sTransportOrder) {
			var that = this;

			// La llamada al servicio se incluye en un Promise porque este servicio puede ser encadenado en otras validaciones
			var oPromise = new Promise(function (resolve, reject) {

				// Recupero los valores en formato SAP				
				var aValuesSAP = that._oView.getModelDataChanged2SAP();
				// Recupero los datos originales de los registros modificados
				var aOriginalValuesSAP = that._oView.getOriginalDataChanged2SAP();

				that._oViewDataService.saveDataSAP(that._oView.getViewInfo().VIEWNAME, JSON.stringify(aValuesSAP), JSON.stringify(aOriginalValuesSAP), sTransportOrder).then((result) => {

						//Se recupera el parámetro de retorno que tendrá los mensajes generales
						var aReturn = [];
						if (result.data.RETURN != '')
							aReturn = JSON.parse(result.data.RETURN);


						that._oView.processDataAfterSave(result.data.DATA, aReturn);

						resolve({
							return: aReturn,
							newOrder: result.data.TRANSPORTORDER
						});
					},
					(error) => {
						debugger;
						reject(error)
					});
			});
			return oPromise;
		},
		_verifyFieldData: function (sPath, sValue, sColumn) {
			var that = this;
			// El servicio lo asocio a un promise para que este servicio pueda ser encadenado con otros
			var oPromise = new Promise(function (resolve, reject) {
				that._oViewDataService.verifyFieldData(that._oView.getViewInfo().VIEWNAME, sValue, sColumn).then((result) => {
						// Si hay mensaje de error se añade a la columna
						if (result.data.MESSAGE != '')
							that._oView.addMsgRowStatusMsgFromPath(sPath, result.data.MESSAGE_TYPE, result.data.MESSAGE, sColumn);

						// Se devuelve el tipo de mensaje devuelto por SAP
						resolve({
							msgType: result.data.MESSAGE_TYPE
						})
					},
					(error) => {
						reject(error)
					});
			});
			return oPromise;

		},
		// Se instacia el objeto vista con los datos pasados + otros que se determinan
		_instanceViewModelObject(sViewName) {
			// Se instancia el objeto vista que guardará toda la información de la vista pasada por parámetro			
			var oView = new viewModel(this._oOwnerComponent);

			// Se guarda la info general de la vista
			oView.setViewInfo(this._viewConfState.getViewInfo(sViewName));

			// Se guarda el catalogo de campos
			//oView.setFieldCatalogFromService(mParams.fieldCatalog);

			return oView;

		},
		// Lectura de configurados y datos
		_readConfDataView: function (mParams, oSuccessHandler, oErrorHandler) {

			var that = this;

			// Nota IRB: Las llamadas se tienen que construir en el propio array. Si se hacen en variables provoca que se llamen de manera inmediata y la recepción
			// del resultado en el promise.all no es correcta, ya que siempre se recibe los datos del primer servicio.			
			var aServices = [this._viewConfState.readView({
				viewName: mParams.viewName,
				fromViewData: true,
				editMode: this._oView.getEditMode()
			}), this.readDataView({
				viewName: mParams.viewName,
				editMode: this._oView.getEditMode()
			})];

			Promise.all(aServices).then((result) => {

					// Se pasa el catalogo de campos
					that._oView.setFieldCatalogFromService(result[0]);

					// En el registro 1 esta los datos y el template
					that._oView.setViewDataFromService(result[1].data);

					// Se ejecuta el código del Success
					oSuccessHandler();

				},
				(error) => {
					oErrorHandler(error);

				});
		},
		// Determinación del modo de edición según nivel de autorización
		_determineEditModeByLevelAuth: function (sViewName) {

			// Se leen los atributos de la vista
			var mViewInfo = this._viewConfState.getViewInfo(sViewName);

			// Si se tiene nivel de autorización "full" entonces tiene permisos para todo. En caso contrario de visualización
			if (mViewInfo.LEVELAUTH == constants.mLevelAuth.full)
				this._oView.setEditMode(constants.editMode.edit);
			else
				this._oView.setEditMode(constants.editMode.view);
		},
		// Recupera los datos que se usarán para las ayudas para búsquedas de determinados campos
		_getSearchHelp: function (oSuccessHandler) {
			var that = this;

			this._oViewDataService.getSearchHelpCatalog(this._oView.getViewInfo().VIEWNAME).then((result) => {

					// Se guarda el resultado el el modelo de datos de la vista
					that._oView.setSearchHelpCatalog(result.data.results);

					// Si hay datos se llama al proceso de obtención de datos.
					// No paso los campos del resultado de la busqueda porque los datos del catalogo se ajustaran en el modelo
					if (result.data.results.length > 0)
						that._getDataForSearchHelp(oSuccessHandler);


				},
				(error) => {
					reject(error)
				});
		},
		// Obtiene los datos para la ayuda para búsqueda a partir del catalogo de campos
		_getDataForSearchHelp: function (oSuccessHandler) {
			var that = this;
			var aCatalog = this._oView.getSearchHelpCatalog();
			debugger;
			for (var x = 0; x < aCatalog.length; x++) {

				this._oViewDataService.getSearchHelpData(this._oView.getViewInfo().VIEWNAME, aCatalog[x].FIELDNAME).then((result) => {

						// Se lanza el proceso de la vista para el campo de la ayuda pará búsqueda
						oSuccessHandler(aCatalog[x].FIELDNAME);
					},
					(error) => {

					});

			}
		},

	});
	return oViewDataState;
});
