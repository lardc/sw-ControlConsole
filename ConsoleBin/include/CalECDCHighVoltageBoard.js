include("TestECDCHighVoltageBoard.js")
include("Tektronix.js")
include("CalGeneral.js")

cal_VtrgtMax  = 500;
cal_VtrgtMin = 0;
cal_VtrgtStp = 20;

cal_UdMax  = 4000;
cal_UdMin = 0;
cal_UdStp = 100;

cal_CurrentRange   = 0;	

cal_CurrentRangeArrayMin = [1, 25, 250, 2000];	
cal_CurrentRangeArrayMax = [30, 300, 2500, 22000];		

cal_Rshunt = 1;
cal_Rload = 1;

cal_CellNumber = 0;

cal_Iterations = 3;

cal_UseAvg = 1;

// Counters
cal_CntTotal = 0;
cal_CntDone = 0;

// Channels
cal_chMeasureId = 1;
cal_chMeasureUd = 2;

// Results storage
cal_Utrgt = [];
cal_Ithr = [];
cal_Ud = [];
cal_Id = [];

// Tektronix data
cal_UtrgtSc = [];
cal_IthrSc = [];
cal_UdSc = [];
cal_IdSc = [];

// Relative error
cal_UtrgtErr = [];
cal_IthrErr = [];
cal_UdErr = [];
cal_IdErr = [];

// Correction
cal_UtrgtCorr = [];
cal_IthrCorr = [];
cal_UdCorr = [];
cal_IdCorr = [];

function CAL_Init(portDevice, portTek, channelMeasureId, channelMeasureUd)
{
	if (channelMeasureId < 1 || channelMeasureId > 4)
	{
		print("Wrong channel numbers");
		return;
	}

	// Copy channel information
	cal_chMeasureUd = channelMeasureUd;
	cal_chMeasureId = channelMeasureId;

	// Init device port
	dev.Disconnect();
	dev.Connect(portDevice);

	// Init Tektronix port
	TEK_PortInit(portTek);
}


function CAL_TekCursor(Channel)
{
	TEK_Send("cursor:select:source ch" + Channel);
	TEK_Send("cursor:function vbars");
	TEK_Send("cursor:vbars:position1 5e-3");
	TEK_Send("cursor:vbars:position2 9e-3");
}

function CAL_TekScale(Channel, Value)
{
	Value = Value / 6;
	TEK_Send("ch" + Channel + ":scale " + Value);
}

function CAL_Measure(Channel, Resolution)
{
	TEK_Send("cursor:select:source ch" + Channel);
	sleep(500);

	var f = TEK_Exec("cursor:vbars:hpos2?");
	if (Math.abs(f) > 2.7e+8)
		f = 0;
	return parseFloat(f).toFixed(Resolution);
}

function CAL_CalibrateTargetU()
{
	// Collect data
	var VtrgtMin = cal_VtrgtMin;
	var VtrgtMax = cal_VtrgtMax;
	var VtrgtStp = cal_VtrgtStp;
	
	CAL_ResetA();
	CAL_ResetUtrgtCal();
	
	if(cal_CellNumber < 0 || cal_CellNumber > 7)
	{
		print("Wrong cell numbers");
		return;
	}
	else
	{
		// Tektronix init
		CAL_TekCursor(cal_chMeasureUd);
		TEK_ChannelInit(cal_chMeasureUd, "100", "50");
	
		// Reload values
		var VoltageArray = CGEN_GetRange(VtrgtMin, VtrgtMax, VtrgtStp);
	
		if ((CAL_CollectTargetU(VoltageArray, cal_Iterations, cal_CellNumber))
		{
			CAL_SaveUtrgt("ECDCHighVoltageBoard_utrgt");
			// Plot relative error distribution
			scattern(cal_UtrgtSc, cal_UtrgtErr, "Voltage (in V)", "Error (in %)", "Voltage target relative error");
			// Calculate correction
			if (cal_CellNumber != 0)
			{
				cal_UdCorr =  cal_Utrgt[0] / cal_UtrgtSc[0];
				CAL_SetCoefUtrgt(cal_UtrgtCorr[0]);
			}
			else
			{
				cal_UdCorr = CGEN_GetCorrection2("ECDCHighVoltageBoard_utrgt");
				CAL_SetCoefUtrgt2(cal_UtrgtCorr[0], cal_UtrgtCorr[1], cal_UtrgtCorr[2]);
			}
			CAL_PrintCoefUtrgt();
		}
	}	
}

function CAL_CalibrateThresholdI()
{
	// Collect data
	var IthrMin = cal_CurrentRangeArrayMin[cal_CurrentRange];
	var IthrMax = cal_CurrentRangeArrayMax[cal_CurrentRange];
	var IthrStp = 10;
	
	CAL_ResetA();
	CAL_ResetIthrCal();
	
	// Tektronix init
	CAL_TekCursor(cal_chMeasureId);
	TEK_ChannelInit(cal_chMeasureId, "100", "50");
	
	// Reload values
	var CurrentArray = CGEN_GetRange(IthrMin, IthrMax, IthrStp);
	
	if (CAL_CollectThreshold(CurrentArray, cal_Iterations))
	{
		CAL_SaveIthr("ECDCHighVoltageBoard_ithr");

		// Plot relative error distribution
		scattern(cal_IthrSc, cal_IthrErr, "Current (in uA)", "Error (in %)", "Current threshold relative error");

		// Calculate correction
		cal_IthrCorr = CGEN_GetCorrection2("ECDCHighVoltageBoard_ithr");
		CAL_SetCoefIthr(cal_IthrCorr[0], cal_IthrCorr[1], cal_IthrCorr[2]);
		CAL_PrintCoefIthr();
	}
}

function CAL_CalibrateUd()
{
	// Collect data
	var UdMin = cal_UdMin;
	var UdMax = cal_UdMax;
	var UdStp = cal_UdStp;
	
	CAL_ResetA();
	CAL_ResetUdCal();
	
	// Tektronix init
	CAL_TekInit(cal_chMeasureUd);
	TEK_ChannelInit(cal_chMeasureUd, "100", "50");
	
	// Reload values
	var VoltageArray = CGEN_GetRange(UdMin, UdMax, UdStp);
	
	if (CAL_UdCollect(VoltageArray, cal_Iterations))
	{
		CAL_SaveUd("ECDCHighVoltageBoard_ud");

		// Plot relative error distribution
		scattern(cal_UdSc, cal_UdErr, "Voltage (in V)", "Error (in %)", "Voltage relative error");

		// Calculate correction
		cal_UdCorr = CGEN_GetCorrection2("ECDCHighVoltageBoard_ud");
		CAL_SetCoefUd(cal_UdCorr[0], cal_UdCorr[1], cal_UdCorr[2]);
		CAL_PrintCoefUd();
	}
}

function CAL_CalibrateId()
{	
	// Collect data
	var IdMin = cal_CurrentRangeArrayMin[cal_CurrentRange];
	var IdMax = cal_CurrentRangeArrayMax[cal_CurrentRange];
	var IdStp = 10;
		
	CAL_ResetA();
	CAL_ResetIdCal();
	
	// Tektronix init
	CAL_TekInit(cal_chMeasureId);
	TEK_ChannelInit(cal_chMeasureId, "100", "50");

	// Reload values
	var CurrentArray = CGEN_GetRange(IdMin, IdMax, IdStp);

	if (CAL_IdCollect(CurrentArray, cal_Iterations))
	{
		CAL_SaveId("ECDCHighVoltageBoard_id");

		// Plot relative error distribution
		scattern(cal_IdSc, cal_IdErr, "Current (in uA)", "Error (in %)", "Current relative error");

		// Calculate correction
		cal_IdCorr = CGEN_GetCorrection2("ECDCHighVoltageBoard_id");
		CAL_SetCoefId(cal_IdCorr[0], cal_IdCorr[1], cal_IdCorr[2]);
		CAL_PrintCoefId();
	}
}

function CAL_VerifyTargetU()
{
	// Collect data
	var VtrgtMin = cal_VtrgtMin;
	var VtrgtMax = cal_VtrgtMax;
	var VtrgtStp = cal_VtrgtStp;
	
	CAL_ResetA();
	
	if(cal_CellNumber < 0 || cal_CellNumber > 7)
	{
		print("Wrong cell numbers");
		return;
	}
	else
	{
		// Tektronix init
		CAL_TekCursor(cal_chMeasureUd);
		TEK_ChannelInit(cal_chMeasureUd, "100", "50");
		
		// Reload values
		var VoltageArray = CGEN_GetRange(VtrgtMin, VtrgtMax, VtrgtStp);
	
		if ((CAL_CollectTargetU(VoltageArray, cal_Iterations, cal_CellNumber))
		{
			CAL_SaveUtrgt("ECDCHighVoltageBoard_utrgt_fixed");
			// Plot relative error distribution
			scattern(cal_UtrgtSc, cal_UtrgtErr, "Voltage (in V)", "Error (in %)", "Voltage target relative error");
		}
	}		
}

function CAL_VerifyThresholdI()
{
	// Collect data
	var IthrMin = cal_CurrentRangeArrayMin[cal_CurrentRange];
	var IthrMax = cal_CurrentRangeArrayMax[cal_CurrentRange];
	var IthrStp = 10;
	
	CAL_ResetA();
	
	// Tektronix init
	CAL_TekCursor(cal_chMeasureId);
	TEK_ChannelInit(cal_chMeasureId, "100", "50");
	
	// Reload values
	var CurrentArray = CGEN_GetRange(IthrMin, IthrMax, IthrStp);
	
	if (CAL_CollectThreshold(CurrentArray, cal_Iterations))
	{
		CAL_SaveIthr("ECDCHighVoltageBoard_ithr_fixed");

		// Plot relative error distribution
		scattern(cal_IthrSc, cal_IthrErr, "Current (in uA)", "Error (in %)", "Current threshold relative error");
	}	
}

function CAL_VerifyUd()
{
	// Collect data
	var UdMin = cal_UdMin;
	var UdMax = cal_UdMax;
	var UdStp = cal_UdStp;
	
	CAL_ResetA();
	
	// Tektronix init
	CAL_TekInit(cal_chMeasureUd);
	TEK_ChannelInit(cal_chMeasureUd, "100", "50");
	
	// Reload values
	var VoltageArray = CGEN_GetRange(UdMin, UdMax, UdStp);

	if (CAL_UdCollect(VoltageArray, cal_Iterations))
	{
		CAL_SaveUd("ECDCHighVoltageBoard_ud_fixed");

		// Plot relative error distribution
		scattern(cal_UdSc, cal_UdErr, "Voltage (in V)", "Error (in %)", "Voltage relative error");
	}
}

function CAL_VerifyId()
{	
	// Collect data
	var IdMin = cal_CurrentRangeArrayMin[cal_CurrentRange];
	var IdMax = cal_CurrentRangeArrayMax[cal_CurrentRange];
	var IdStp = 10;
		
	CAL_ResetA();
	
	// Tektronix init
	CAL_TekInit(cal_chMeasureId);
	TEK_ChannelInit(cal_chMeasureId, "100", "50");

	// Reload values
	var CurrentArray = CGEN_GetRange(IdMin, IdMax, IdStp);

	if (CAL_IdCollect(CurrentArray, cal_Iterations))
	{
		CAL_SaveId("ECDCHighVoltageBoard_id_fixed");

		// Plot relative error distribution
		scattern(cal_IdSc, cal_IdErr, "Current (in uA)", "Error (in %)", "Current relative error");
	}
}

function CAL_CollectTargetU(VoltageValues, IterationsCount, CellNumder)
{
	cal_CntTotal = IterationsCount * VoltageValues.length;
	cal_CntDone = 1;
	
	var CountOffSet = 0;
	
	if(CellNumber != 0)
	{
		CountOffSet = VoltageValues.length - 1;
		cal_CntTotal = IterationsCount;
	}

	var AvgNum;
	if (cal_UseAvg)
	{
		AvgNum = 4;
		TEK_AcquireAvg(AvgNum);
	}
	else
	{
		AvgNum = 1;
		TEK_AcquireSample();
	}
	
	TEK_Horizontal("1e-3", "-2e-3");
	TEK_TriggerPulseInit(cal_chMeasureUd, "50");
	
	for (var i = 0; i < IterationsCount; i++)
	{
		for (var j = 0 + CountOffSet; j < VoltageValues.length; j++)
		{
			print("-- result " + cal_CntDone++ + " of " + cal_CntTotal + " --");
			//
			CAL_TekScale(cal_chMeasureUd, VoltageValues[j]);
			TEK_TriggerLevelF(VoltageValues[j] / 2);
			
			for (var k = 0; k < AvgNum; k++)
			{
				ECDC_HV_CalCell(VoltageValues[j], CellNumder);
				sleep (10000);
			}
	
			// Unit data
			var UtrgtRead = dev.r(128);
			cal_Utrgt.push(UtrgtRead);
			print("Utrgt, V: " + UtrgtRead);
			// Scope data
			var UtrgtSc = (CAL_Measure(cal_chMeasureUd)).toFixed(2);
			cal_UtrgtSc.push(UtrgtSc);
			print("UtrgtTek, V: " + UtrgtSc);
			// Relative error
			var UtrgtErr = ((UtrgtRead - UtrgtSc) / UtrgtSc * 100).toFixed(2);
			cal_UtrgtErr.push(UtrgtErr);
			print("UtrgtErr, %: " + UtrgtErr);
			print("--------------------");
			
			if (anykey()) return 0;
		}
	}
	return 1;
}

function CAL_CollectThresholdI(CurrentValues, IterationsCount)
{
	cal_CntTotal = IterationsCount * CurrentValues.length;
	cal_CntDone = 1;

	var AvgNum;
	if (cal_UseAvg)
	{
		AvgNum = 4;
		TEK_AcquireAvg(AvgNum);
	}
	else
	{
		AvgNum = 1;
		TEK_AcquireSample();
	}
	
	TEK_Horizontal("1e-3", "-2e-3");
	TEK_TriggerPulseInit(cal_chMeasureId, "50");
	
	for (var i = 0; i < IterationsCount; i++)
	{
		for (var j = 0; j < CurrentValues.length; j++)
		{
			print("-- result " + cal_CntDone++ + " of " + cal_CntTotal + " --");
			//
			CAL_TekScale(cal_chMeasureId, CurrentValues[j]* cal_Rload / 1000000);
			TEK_TriggerLevelF((CurrentValues[j]* cal_Rload / 1000000) / 2);
			
			for (var k = 0; k < AvgNum; k++)
			{
				ECDC_HV_Measure(CurrentValues[j]* cal_Rload / 1000000, CurrentValues[j]);
				sleep(1000);
			}
	
			// Unit data
			var IthrRead = r32(129);
			cal_Ithr.push(IthrRead);
			print("Ithr, uI: " + IthrRead);
			// Scope data
			var IthrSc = (CAL_Measure(cal_chMeasureId) / cal_Rshunt * 1000000).toFixed(2);
			cal_IthrSc.push(IthrSc);
			print("IthrTek, uI: " + IthrSc);
			// Relative error
			var IthrErr = ((IthrRead - IthrSc) / IthrSc * 100).toFixed(2);
			cal_IthrErr.push(IthrErr);
			print("IthrtErr, %: " + IthrErr);
			print("--------------------");
			
			if (anykey()) return 0;
		}
	}
	return 1;
}

function CAL_CollectUd(VoltageValues, IterationsCount)
{
	cal_CntTotal = IterationsCount * VoltageValues.length;
	cal_CntDone = 1;

	var AvgNum;
	if (cal_UseAvg)
	{
		AvgNum = 4;
		TEK_AcquireAvg(AvgNum);
	}
	else
	{
		AvgNum = 1;
		TEK_AcquireSample();
	}
	TEK_Horizontal("1e-3", "-2e-3");
	TEK_TriggerPulseInit(cal_chMeasureUd, "50");
	
	for (var i = 0; i < IterationsCount; i++)
	{
		for (var j = 0; j < VoltageValues.length; j++)
		{
			print("-- result " + cal_CntDone++ + " of " + cal_CntTotal + " --");
			//
			for (var k = 0; k < AvgNum; k++)
			{
				ECDC_HV_Measure(VoltageValues[j], VoltageValues[j] / cal_Rload * 1000000);
				sleep(1000);
			}
			
			// Unit data
			var UdRead = dev.r(198);
			cal_Ud.push(UdRead);
			print("Udread, V: " + UdRead);

			// Scope data
			var UdSc = (CAL_Measure(cal_chMeasureUd)).toFixed(2);
			cal_UdSc.push(UdSc);
			print("Udtek, V: " + UdSc);

			// Relative error
			var UdErr = ((UdRead - UdSc) / UdSc * 100).toFixed(2);
			cal_UdErr.push(UdErr);
			print("Uderr, %: " + UdErr);
			print("--------------------");
			
			if (anykey()) return 0;
		}
	}

	return 1;
}

function CAL_CollectId(CurrentValues, IterationsCount)
{
	cal_CntTotal = IterationsCount * CurrentValues.length;
	cal_CntDone = 1;

	var AvgNum;
	if (cal_UseAvg)
	{
		AvgNum = 4;
		TEK_AcquireAvg(AvgNum);
	}
	else
	{
		AvgNum = 1;
		TEK_AcquireSample();
	}
	TEK_Horizontal("1e-3", "-2e-3");
	TEK_TriggerPulseInit(cal_chMeasureId, "50");
	
	for (var i = 0; i < IterationsCount; i++)
	{
		for (var j = 0; j < CurrentValues.length; j++)
		{
			print("-- result " + cal_cntDone++ + " of " + cal_cntTotal + " --");
			//
			CAL_TekScale(cal_chMeasureId, CurrentValues[j]* cal_Rload / 1000000);
			TEK_TriggerLevelF((CurrentValues[j]* cal_Rload / 1000000) / 2);
			
			for (var k = 0; k < AvgNum; k++)
			{
				ECDC_HV_Measure(CurrentValues[j]* cal_Rload / 1000000, CurrentValues[j]);
				sleep(1000);
			}
			
			// Unit data
			var IdRead = r32(199);
			cal_Id.push(IdRead);
			print("Idread, uA: " + IdRead);

			// Scope data
			var IdSc = (CAL_Measure(cal_chMeasureId) / cal_Rload * 1000000).toFixed(2);
			cal_Id_sc.push(IdSc);
			print("Idtek, uA: " + IdSc);

			// Relative error
			var IdErr = ((IdRead - IdSc) / IdSc * 100).toFixed(2);
			cal_IdErr.push(IdErr);
			print("Iderr, %: " + IdErr);
			print("--------------------");
			
			if (anykey()) return 0;
		}
	}

	return 1;
}

function CAL_ResetA()
{	
	// Results storage
	cal_Utrgt = [];
	cal_Ithr = [];
	cal_Ud = [];
	cal_Id = [];

	// Tektronix data
	cal_UtrgtSc = [];
	cal_IthrSc = [];
	cal_UdSc = [];
	cal_IdSc = [];

	// Relative error
	cal_UtrgtErr = [];
	cal_IthrErr = [];
	cal_UdErr = [];
	cal_IdErr = [];

	// Correction
	cal_UtrgtCorr = [];
	cal_IthrCorr = [];
	cal_UdCorr = [];
	cal_IdCorr = [];
}

function CAL_SaveUtrgt(NameUtrgt)
{
	CGEN_SaveArrays(NameUtrgt, cal_Utrgt, cal_UtrgtSc, cal_UtrgtErr);
}

function CAL_SaveUd(NameUd)
{
	CGEN_SaveArrays(NameUd, cal_Ud, cal_UdSc, cal_UdErr);
}

function CAL_SaveIthr(NameIthr)
{
	CGEN_SaveArrays(NameIthr, cal_Ithr, cal_IthrSc, cal_IthrErr);
}

function CAL_SaveId(NameId)
{
	CGEN_SaveArrays(NameId, cal_Id, cal_IdSc, cal_IdErr);
}

function CAL_SetCoefUtrgt2(P2, P1, P0)
{
	dev.ws(22, Math.round(P0));
	dev.w(21, Math.round(P1 * 1000));
	dev.ws(20, Math.round(P2 * 1e6));
}

function CAL_SetCoefUtrgt(K)
{
	switch(cal_CellNumber)
	{	
		case 1:
		{
			dev.w(25, Math.round(K));
		}
		break;
		
		case 2:
		{
			dev.w(26, Math.round(K));
		}
		break;
		
		case 3:
		{
			dev.w(27, Math.round(K));
		}
		break;
		
		case 4:
		{
			dev.w(28, Math.round(K));
		}
		break;
		
		case 5:
		{
			dev.w(29, Math.round(K));
		}
		break;
		
		case 6:
		{
			dev.w(30, Math.round(K));
		}
		break;
		
		case 7:
		{
			dev.w(31, Math.round(K));
		}
		break;
	}
}

function CAL_SetCoefIthr(P2, P1, P0)
{
		switch(cal_CurrentRange)
	{	
		case 0:
		{
			dev.ws(37, Math.round(P0));
			dev.w(36, Math.round(P1 * 1000));
			dev.ws(35, Math.round(P2 * 1e6))
		}
		break;
		
		case 1:
		{
			dev.ws(42, Math.round(P0));
			dev.w(41, Math.round(P1 * 1000));
			dev.ws(40, Math.round(P2 * 1e6))
		}
		break;
		
		case 2:
		{
			dev.ws(47, Math.round(P0));
			dev.w(46, Math.round(P1 * 1000));
			dev.ws(45, Math.round(P2 * 1e6))
		}
		break;
		
		case 3:
		{
			dev.ws(52, Math.round(P0));
			dev.w(51, Math.round(P1 * 1000));
			dev.ws(50, Math.round(P2 * 1e6))
		}
		break;		
}

function CAL_SetCoefUd(P2, P1, P0)
{
	dev.ws(57, Math.round(P0));
	dev.w(56, Math.round(P1 * 1000));
	dev.ws(55, Math.round(P2 * 1e6));
}

function CAL_SetCoefId(P2, P1, P0)
{
		switch(cal_CurrentRange)
	{	
		case 0:
		{
			dev.ws(62, Math.round(P0));
			dev.w(61, Math.round(P1 * 1000));
			dev.ws(60, Math.round(P2 * 1e6))
		}
		break;
		
		case 1:
		{
			dev.ws(67, Math.round(P0));
			dev.w(66, Math.round(P1 * 1000));
			dev.ws(65, Math.round(P2 * 1e6))
		}
		break;
		
		case 2:
		{
			dev.ws(72, Math.round(P0));
			dev.w(71, Math.round(P1 * 1000));
			dev.ws(70, Math.round(P2 * 1e6))
		}
		break;
		
		case 3:
		{
			dev.ws(77, Math.round(P0));
			dev.w(76, Math.round(P1 * 1000));
			dev.ws(75, Math.round(P2 * 1e6))
		}
		break;		
}

function CAL_ResetUtrgtCal()
{
	if (cal_CellNumber ==0)
	{
		CAL_SetCoefUtrgt2(0, 1, 0);
	}
	else
	{
		CAL_SetCoefUtrgt(1);
	}
}

function CAL_ResetIthrCal()
{
	CAL_SetCoefIthr(0, 1, 0);
}

function CAL_ResetUdCal()
{
	CAL_SetCoefUd(0, 1, 0);
}

function CAL_ResetIdCal()
{
	CAL_SetCoefId(0, 1, 0);
}

function CAL_PrintCoefUtrgt()
{
	switch(cal_CurrentRange)
	{
		case 0:
		{
			print("Cell 0 P0 		: " + dev.rs(22));
			print("Cell 0 P1 x1000	: " + dev.rs(21));
			print("Cell 0 P2 x1e6 	: " + dev.rs(20));
		}
		break;
		
		case 1:
		{
			print("Cell 1 K	: " + dev.rs(25));
		}
		break;
		
		case 2:
		{
			print("Cell 2 K	: " + dev.rs(26));
		}
		break;
		
		case 3:
		{
			print("Cell 3 K	: " + dev.rs(27));
		}
		break;
		
		case 4:
		{
			print("Cell 4 K	: " + dev.rs(28));
		}
		break;
		
		case 5:
		{
			print("Cell 5 K	: " + dev.rs(29));
		}
		break;
		
		case 6:
		{
			print("Cell 6 K	: " + dev.rs(30));
		}
		break;
		
		case 7:
		{
			print("Cell 7 K	: " + dev.rs(31));
		}
		break;
	}
}

function CAL_PrintCoefIthr()
{
	switch(cal_CurrentRange)
	{
		case 0:
		{
			print("Id 0 P0			: " + dev.rs(37));
			print("Id 0 P1 x1000	: " + dev.rs(36));
			print("Id 0 P2 x1e6		: " + dev.rs(35));
		}
		break;
		
		case 1:
		{
			print("Id 1 P0			: " + dev.rs(42));
			print("Id 1 P1 x1000	: " + dev.rs(41));
			print("Id 1 P2 x1e6		: " + dev.rs(40));
		}
		break;
		
		case 2:
		{
			print("Id 2 P0			: " + dev.rs(47));
			print("Id 2 P1 x1000	: " + dev.rs(46));
			print("Id 2 P2 x1e6		: " + dev.rs(45));
		}
		break;
		
		case 3:
		{
			print("Id 3 P0			: " + dev.rs(52));
			print("Id 3 P1 x1000	: " + dev.rs(51));
			print("Id 3 P2 x1e6		: " + dev.rs(50));
		}
		break;
	}
}

function CAL_PrintCoefUd()
{
	print("Ud  P0 	    : " + dev.rs(57));
	print("Ud  P1 x1000 : " + dev.rs(56));
	print("Ud  P2 x1e6  : " + dev.rs(55));
}

function CAL_PrintCoefId()
{
	switch(cal_CurrentRange)
	{
		case 0:
		{
			print("Id 0 P0			: " + dev.rs(60));
			print("Id 0 P1 x1000	: " + dev.rs(61));
			print("Id 0 P2 x1e6		: " + dev.rs(62));
		}
		break;
		
		case 1:
		{
			print("Id 1 P0			: " + dev.rs(67));
			print("Id 1 P1 x1000	: " + dev.rs(66));
			print("Id 1 P2 x1e6		: " + dev.rs(65));
		}
		break;
		
		case 2:
		{
			print("Id 2 P0			: " + dev.rs(72));
			print("Id 2 P1 x1000	: " + dev.rs(71));
			print("Id 2 P2 x1e6		: " + dev.rs(70));
		}
		break;
		
		case 3:
		{
			print("Id 3 P0			: " + dev.rs(77));
			print("Id 3 P1 x1000	: " + dev.rs(76));
			print("Id 3 P2 x1e6		: " + dev.rs(75));
		}
		break;
	}
}

