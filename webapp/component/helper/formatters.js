sap.ui.define(
	[
		"sap/ui/base/Object",
		"sap/ui/core/format/NumberFormat"
	],
	function (Object, NumberFormat) {
		"use strict";

		return Object.extend("com.ivancio.zal30-ui5.component.helper.formatter", {
			//////////////////////////////////	
			//        Public methods        //	
			//////////////////////////////////
			constructor: function () {
				Object.call(this);

				// Se guarda los valores por defecto, si el parámetro se pasa
				this._initValues();


			},
			// Formatea float según los decimales pasados
			formatFloat: function (nDecimals, oValue) {
				var oFormatObject = this.getFormatObjectFloat(nDecimals);
				return oFormatObject.format(oValue);
			},
			// Devuelve un objeto float con la configuración necesaria para aplicar un formato
			getFormatObjectFloat: function (nDecimals) {

				var oFormatOptions = {
					decimals: nDecimals ? nDecimals : 0, // Si no se pasan decimales se establece que no tiene decimales
					groupingSeparator: this._oFormatValues.thousandSeparator,
					decimalSeparator: this._oFormatValues.decimalSeparator,
					maxFractionDigits: this._oFormatValues.decimalSeparator
				};

				return NumberFormat.getFloatInstance(oFormatOptions);

			},
			// Desformatea un float para dejarlo con su formato original. Es la inversa del formatFloat
			// En ui5 sería el parse
			parseFloat: function (nDecimals, oValue) {
				var oFormatObject = this.getFormatObjectFloat(nDecimals);
				return oFormatObject.parse(oValue);
			},
			// Devuelve un objeto interger con la configuración necesaria para aplicar un formato
			getFormatObjectInteger: function () {

				var oFormatOptions = {
					decimals: 0, // El integer no tiene decimales
					groupingSeparator: this._oFormatValues.thousandSeparator
				};

				return NumberFormat.getIntegerInstance(oFormatOptions);

			},
			// Desformatea un integer para dejarlo con su formato original. Es la inversa del formatInteger
			// En ui5 sería el parse
			parseInteger: function (oValue) {
				var oFormatObject = this.getFormatObjectInteger();
				return oFormatObject.parse(oValue);
			},
			// Formatea un interger
			formatInteger: function (oValue) {
				var oFormatObject = this.getFormatObjectInteger();
				return oFormatObject.format(oValue);
			},
			// Establece el separador decimal
			setDecimalSeparator: function (sValue) {
				this._oFormatValues.decimalSeparator = sValue;
			},
			// Devuelve el separador decimal
			getDecimalSeparator: function () {
				return this._oFormatValues.decimalSeparator;
			},
			// Establece el separador de miles
			setThousandSeparator: function (sValue) {
				this._oFormatValues.thousandSeparator = sValue;
			},
			// devuelve el separador de miles
			getThousandSeparator: function () {
				return this._oFormatValues.thousandSeparator;
			},
			// Establece como se visualiza la fecha
			setDisplayDateFormat: function (sValue) {
				this._oFormatValues.displayDateFormat = sValue;
			},
			// Devuelve como se visualiza la fecha
			getDisplayDateFormat: function () {
				return this._oFormatValues.displayDateFormat;
			},
			// Devuelve como el formato interno de la fecha
			getDateFormat: function () {
				return this._oFormatValues.dateFormat;
			},
			// Establece como se visualiza la hora
			setDisplayTimeFormat: function (sValue) {
				this._oFormatValues.displayTimeFormat = sValue;
			},
			// Devuelve como se visualiza la hora
			getDisplayTimeFormat: function () {
				return this._oFormatValues.displayTimeFormat;
			},
			// Devuelve el formato interno la hora
			getTimeFormat: function () {
				return this._oFormatValues.timeFormat;
			},
			// Convierte el valor de como se visualiza la fecha en SAP a UI5
			convertDisplayDateFormatSAP2UI5(sValue) {
				switch (sValue) {
					case "1": // DD.MM.YYYY	
						return "dd.MM.yyyy";
						break;
					case "2": // MM.DD.YYYY	
						return "MM.dd.yyyy";
						break;
					case "3": // MM-DD-YYYY	
						return "MM-dd-yyyy";
						break;
					case "4": // YYYY.MM.DD	
						return "yyyy.MM.dd";
						break;
					case "5": // YYYY/MM/DD		
						return "yyyy/MM/dd";
						break;
					case "6": // YYYY-MM-DD		
						return "yyyy-MM-dd";
						break;
					default: // Cualquier otro valor se devuelve el valor por defecto
						return this._oFormatValues.displayDateFormat;

				};
			},
			//////////////////////////////////	
			//        Private methods       //	
			//////////////////////////////////

			// Informa los parámetors por defecto segun los parámetros informados.
			// De estos parçametros los unicos que no podrán ser modificados serán el timeFormat y dateFormat porque es el formato
			// interno de SAP y que se usará para enviar los datos
			_initValues: function () {

				this._oFormatValues = {
					displayDateFormat: "dd/MM/yyyy",
					displayTimeFormat: "HH:mm:ss",
					timeFormat: "HHmmss",
					dateFormat: "yyyyMMdd",
					decimalSeparator: sap.ui.core.format.NumberFormat.getFloatInstance().oFormatOptions.decimalSeparator,
					thousandSeparator: sap.ui.core.format.NumberFormat.getFloatInstance().oFormatOptions.decimalSeparator === "." ? "," : "."
				};


			}
		});

	});
