sap.ui.define([], function () {
	"use strict";
	var oConstants = {

		mLevelAuth: {
			full: "F",
			read: "R",
			non: "N"
		},
		editMode: {
			edit: "U",
			view: "V"
		},
		messageType: {
			error: "E",
			success: "S",
			warning: "W"
		},
		objectsId: {
			viewSelect: {
				viewInput: "viewInput"
			},
			viewData: {
				tableData: "tableData"
			}
		},
		services: {
			filter: {
				langu: "LANGU",
				viewName: "VIEWNAME",
				mode: "MODE"
			}
		},
		jsonModel: {
			viewConf: "ViewConf",
			ViewSelect: "ViewSelectModel",
			viewData: "viewData",
			dialog: "dialog"
		},
		columnTtype: {
			char: "C",
			date: "D",
			time: "T",
			packed: "P",
			integer:"I"
		},
		tableData: {
			columnObjectType: {
				input: "input",
				datePicker: "datepicker",
				timePicker: "timepicker",
				checkbox: "checkbox"
			},
			suffixEditField: "_ZAL30_EDIT",
			suffixSearchHelpField:"_ZAL30_SEARCH_HELP",
			suffixValueState:{
				valueState:"_ZAL30_VALUE_STATE",
				valueStateText:"_ZAL30_VALUE_STATE_TEXT"
			},
			internalFields: {
				isDict: "ZAL30_IS_DICT",
				tabix: "ZAL30_TABIX",
				updkz: "ZAL30_UPDKZ",
				rowStatus: "ZAL30_ROW_STATUS",
				rowStatusInternal: "ZAL30_ROW_STATUS_INTERNAL",
				rowStatusMsg: "ZAL30_ROW_STATUS_MSG",
				rowStatusMsgInternal: "ZAL30_ROW_STATUS_MSG_INTERNAL",
				style:"ZAL30_UI5_STYLE",				
			},
			fixedColumns: {
				actions: 'ZAL30_FIX_ACTIONS',
			},
			rowStatusValues: {
				error: "E",
				valid: "S"
			},
			fieldUpkzValues: {
				update: "U",
				insert: "I",
				delete: "D"
			},
			path: {
				values: "/values",
				columns: "/columns",
				tableRowActionCount: "/tableRowActionCount",
				visibleFixColumnAction: "/visibleFixColumnAction"
			},
			customData: {
				columnName: "columnName",
				objectType: "objectType",
				changeRow: "changeRow"
			},
			dataType: {
				mandt: "CLNT"
			},
			valueStates:{
				ok:"None",
				error:"Error"
			}

		}
	};
	return oConstants

});
