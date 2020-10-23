include("TestECDCHighVoltageBoard.js")
include("Tektronix.js")
include("CalGeneral.js")

cal_VtrgtMax  = 500;
cal_VtrgtMin = 0;
cal_VtrgtStp = 20;

cal_VoltageRange   = 0;	
cal_CurrentRange   = 0;	

cal_IRangeMax = ;
cal_IRangeMin = ;
cal_IRangeStp = ;

cal_Rshunt = 1;
cal_Rload = 1;

cal_CellNumber = 0;

cal_Iterations = 3;

cal_UseAvg = 1;

function CAL_CalibrateTargetU()
{
	// Collect data
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
		CAL_TekInit(cal_chMeasureUd);
		
		// Reload values
		var VoltageArray = CGEN_GetRange(cal_VtrgtMin, cal_VtrgtMax, cal_VtrgtStp);
	
		if ((CAL_CollectTarget(VoltageArray, cal_Iterations, cal_CellNumber))
		{
			CAL_SaveUtrgt("ECDCHighVoltageBoard_utrgt");
			// Plot relative error distribution
			scattern(cal_Utrgt_sc, cal_Utrgt_err, "Voltage (in V)", "Error (in %)", "Voltage relative error");
			// Calculate correction
			if (cal_CellNumber ==0)
			{
				cal_id_corr = CGEN_GetCorrection2("ECDCHighVoltageBoard_utrgt");
				CAL_SetCoefUtrgt2(cal_utrgt_corr[0], cal_utrgt_corr[1], cal_utrgt_corr[2]);
			}
			else
			{
				cal_id_corr =  cal_Utrgt / cal_Utrgt_sc;
				CAL_SetCoefUtrgt(cal_utrgt_corr[0]);
			}
			CAL_PrintCoefUtrgt();
		}
	}	
}

function CAL_CalibrateTargetI()
{
	// Collect data
	CAL_ResetA();
	CAL_ResetItrgtCal();
	
	// Tektronix init
	CAL_TekInit(cal_chMeasureId);
	
	// Reload values
	var VoltageArray = CGEN_GetRange(cal_ItrgtMin, cal_ItrgtMax, cal_ItrgtStp);
	
	if ((CAL_CollectTarget(VoltageArray, cal_Iterations, cal_CellNumber))
		{
			
		}
	
}

function CAL_CalibrateUd()
{
	// Collect data
	CAL_ResetA();
	CAL_ResetUdCal();
	
	// Tektronix init
	CAL_TekInit(cal_chMeasureUd);
	
	// Reload values
	var VoltageArray = CGEN_GetRange(cal_UdMin, cal_UdMax, cal_UdStp);
	
	if (CAL_UdCollect(VoltageArray, cal_Iterations))
	{
		CAL_SaveUd("ECDCHighVoltageBoard_ud");

		// Plot relative error distribution
		scattern(cal_ud_sc, cal_ud_err, "Voltage (in V)", "Error (in %)", "Voltage relative error");

		// Calculate correction
		cal_ud_corr = CGEN_GetCorrection2("ECDCHighVoltageBoard_ud");
		CAL_SetCoefUd(cal_ud_corr[0], cal_ud_corr[1], cal_ud_corr[2]);
		CAL_PrintCoefUd();
	}
	
}

function CAL_CollectTarget(VoltageValues, IterationsCount, CellNumder)
{
	cal_cntTotal = IterationsCount * VoltageValues.length;
	cal_cntDone = 1;
	
	var CountOffSet = 0;
	if(CellNumber != 0)
	{
		CountOffSet = VoltageValues.length - 1;
		cal_cntTotal = IterationsCount;
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
	
	for (var i = 0; i < IterationsCount; i++)
	{
		for (var j = 0 + CountOffSet; j < VoltageValues.length; j++)
		{
			print("-- result " + cal_cntDone++ + " of " + cal_cntTotal + " --");
			//
			for (var k = 0; k < AvgNum; k++)
			{
				ECDC_HV_Measure(VoltageValues[j], Idmax);
				//if (dev.r(192) == 3)
				//{
				//	dev.w(128, Vcellmax);
				//	w32(129, Idmax);
				//	dev.c(100);	
				//	while(dev.r(192) == 4){sleep(10);}	
				//}
				//else
				//{
				//	if(dev.r(192) != 1)
				//	print("Device not ready");
				//	else
				//	PrintStatus();
				//}
				sleep (10000);
			}
	
			// Unit data
			var Utrgt_read = dev.r(128);
			cal_Utrgt.push(Utrgt_read);
			print("Utrgt, V: " + Utrgt_read);
			// Scope data
			var Utrgt_sc = (CAL_MeasureUd(cal_chMeasureUd)).toFixed(2);
			cal_Utrgt_sc.push(Utrgt_sc);
			print("UtrgtTek, V: " + Utrgt_sc);
			// Relative error
			var Utrgt_err = ((Utrgt_read - Utrgt_sc) / Utrgt_sc * 100).toFixed(2);
			cal_Utrgt_err.push(Utrgt_err);
			print("UtrgtErr, %: " + Utrgt_err);
			print("--------------------");
			
			if (anykey()) return 0;
		}
	}
	return 1;
}

function CAL_UdCollect(VoltageValues, IterationsCount)
{
	cal_cntTotal = IterationsCount * VoltageValues.length;
	cal_cntDone = 1;

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
	
	for (var i = 0; i < IterationsCount; i++)
	{
		for (var j = 0; j < VoltageValues.length; j++)
		{
			print("-- result " + cal_cntDone++ + " of " + cal_cntTotal + " --");
			//
			for (var k = 0; k < AvgNum; k++)
			{
				ECDC_HV_Measure(VoltageValues[j], VoltageValues[j] / cal_Rload * 0.9 * 1000000);
				sleep(1000);
			}
			
			ECDC_CB_Print = cal_print_copy;
			
			// Unit data
			var Ud_read = dev.r(198);
			cal_Ud.push(Ud_read);
			print("Udread, V: " + Ud_read);

			// Scope data
			var Ud_sc = (CAL_MeasureUd(cal_chMeasureUd)).toFixed(2);
			cal_Ud_sc.push(Ud_sc);
			print("Udtek, V: " + Ud_sc);

			// Relative error
			var Ud_err = ((Ud_read - Ud_sc) / Ud_sc * 100).toFixed(2);
			cal_Ud_err.push(Ud_err);
			print("Uderr, %: " + Ud_err);
			print("--------------------");
			
			if (anykey()) return 0;
		}
	}

	return 1;
}

function CAL_SaveUtrgt(NameUtrgt)
{
	CGEN_SaveArrays(NameUtrgt, cal_Utrgt, cal_Utrgt_sc, cal_Utrgt_err);
}

function CAL_SaveUd(NameUd)
{
	CGEN_SaveArrays(NameUd, cal_Ud, cal_Ud_sc, cal_Ud_err);
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

function CAL_SetCoefUd(P2, P1, P0)
{
	dev.ws(57, Math.round(P0));
	dev.w(56, Math.round(P1 * 1000));
	dev.ws(55, Math.round(P2 * 1e6));
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

function CAL_ResetUdCal()
{
	CAL_SetCoefUd(0, 1, 0);
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

function CAL_PrintCoefUd()
{
	print("Ud  P0 	    : " + dev.rs(57));
	print("Ud  P1 x1000 : " + dev.rs(56));
	print("Ud  P2 x1e6  : " + dev.rs(55));
}

