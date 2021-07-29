include("TestCS.js")
include("TestGTU_4.0.js")
include("TestBVT.js")
include("TestLSLH.js")
include ("TestQRRHP.js")

mme_cs_def_force = 5;
mme_cs_force = 25;
mme_cs_height = 35;
//
mme_bvt_current = 5;
mme_bvt_voltage = 500;
//
mme_qrr_current = 400;
mme_qrr_current_rate = 30;
mme_qrr_voltage = 1500;
mme_qrr_voltage_rate = 1000;
mme_qrr_mode = 1; // 0 - QRR, 1 - QRR Tq
//
mme_counter = 0;

// definitions
mme_GTU =		0;
mme_SL =		1;
mme_BVTD =		2;
mme_BVTR =		3;
mme_CSDEF =		4;
mme_CSMAX =		5;
mme_QRR = 		6;

// active blocks
mme_use_GTU = 	1;
mme_use_SL = 	1;
mme_use_BVT =	1;
mme_use_CS = 	0;
mme_use_QRR =	1;

// NodeID
mme_Nid_HMIU = 0;
mme_Nid_GTU = 3;
mme_Nid_SL = 9;
mme_Nid_BVT = 4;
mme_Nid_CS = 6;
mme_Nid_CU = 1;
mme_Nid_CROVU = 7;
mme_Nid_SCTU = 8;
mme_Nid_ATU = 9;
mme_Nid_CUext = 5;
mme_Nid_QRR = 10;


// settings
mme_plot = 0;		// Plot graphics

function MME_Units()
{
	var ret = 1;
	
	dev.nid(mme_Nid_HMIU);
	try
	{
		dev.Read16Silent(0);
		print("[Node 0]  HMIU:	OK");
	}
	catch (e)
	{
		print("[Node 0]  HMIU:	None");
		ret = 0;
	}
	
	dev.nid(mme_Nid_CU);
	try
	{
		dev.Read16Silent(0);
		print("[Node 1]  CU:	OK");
	}
	catch (e)
	{
		print("[Node 1]  CU:	None");
		ret = 0;
	}
	
	dev.nid(mme_Nid_SL);
	try
	{
		dev.Read16Silent(0);
		print("[Node 2]  SL:	OK");
	}
	catch (e)
	{
		print("[Node 2]  SL:	None");
		ret = 0;
	}
	
	dev.nid(mme_Nid_GTU);
	try
	{
		dev.Read16Silent(0);
		print("[Node 3]  GTU:	OK");
	}
	catch (e)
	{
		print("[Node 3]  GTU:	None");
		ret = 0;
	}
	
	dev.nid(mme_Nid_BVT);
	try
	{
		dev.Read16Silent(0);
		print("[Node 4]  BVT:	OK");
	}
	catch (e)
	{
		print("[Node 4]  BVT:	None");
		ret = 0;
	}
	
	dev.nid(mme_Nid_CUext);
	try
	{
		dev.Read16Silent(0);
		print("[Node 5]  CUext:	OK");
	}
	catch (e)
	{
		print("[Node 5]  CUext:	None");
		ret = 0;
	}
	
	dev.nid(mme_Nid_CS);
	try
	{
		dev.Read16Silent(0);
		print("[Node 6]  CS:	OK");
	}
	catch (e)
	{
		print("[Node 6]  CS:	None");
		ret = 0;
	}
	
	dev.nid(mme_Nid_CROVU);
	try
	{
		dev.Read16Silent(0);
		print("[Node 7]  dVdt:	OK");
	}
	catch (e)
	{
		print("[Node 7]  dVdt:	None");
		ret = 0;
	}
	
	dev.nid(mme_Nid_SCTU);
	try
	{
		dev.Read16Silent(0);
		print("[Node 8]  SCTU:	OK");
	}
	catch (e)
	{
		print("[Node 8]  SCTU:	None");
		ret = 0;
	}
	
	dev.nid(mme_Nid_ATU);
	try
	{
		dev.Read16Silent(0);
		print("[Node 9]  ATU:	OK");
	}
	catch (e)
	{
		print("[Node 9]  ATU:	None");
		ret = 0;
	}
	
	dev.nid(mme_Nid_QRR);
	try
	{
		dev.Read16Silent(0);
		print("[Node 10] QRR:	OK");
	}
	catch (e)
	{
		print("[Node 10] QRR:	None");
		ret = 0;
	}
	
	return ret;
}

function MME_TestUnits(UnitArray, Num, Pause)
{
	var i, j;
	var Counter = 0, Fails = 0;
	var FailArray = [];
	
	for (i = 0; i < UnitArray.length; i++)
		FailArray[i] = 0;

	for (i = 0; i < Num; i++)
	{
		for (j = 0; j < UnitArray.length; j++)
		{
			print("# " + (Counter + 1));
			print("Fails sum:	" + Fails);
			print("Node check:	" + UnitArray[j]);
			
			dev.nid(UnitArray[j])
			try
			{
				dev.Read16Silent(0);
			}
			catch (e)
			{
				Fails++;
				FailArray[j]++;
			}
			
			print("------------------");
			
			Counter++;
			sleep(Pause);
			if (anykey()) return;
		}
	}
	
	print("Fails by nodes")
	for (i = 0; i < UnitArray.length; i++)
		print("Node " + UnitArray[i] + ":	" + FailArray[i]);
}

function MME_IsReady()
{
	// cu
	dev.nid(mme_Nid_CU);
	if (dev.r(96) == 0) dev.c(1);
	if (dev.r(96) != 3)
	{
		print("CU not ready");
		return 0;
	}
	
	// sl
	if (mme_use_SL)
	{
		dev.nid(mme_Nid_SL);
		if (dev.r(192) == 0) dev.c(1);
		while (dev.r(192) == 3) sleep(100);
		if (dev.r(192) != 4)
		{
			print("SL not ready");
			return 0;
		}
	}
	
	// bvt
	if (mme_use_BVT)
	{
		dev.nid(mme_Nid_BVT);
		if (dev.r(192) == 0) dev.c(1);
		if (dev.r(192) != 4)
		{
			print("BVT not ready");
			return 0;
		}
	}
	
	// cs
	if (mme_use_CS)
	{
		dev.nid(mme_Nid_CS);
		if (dev.r(96) == 0) dev.c(100);
		while (dev.r(96) == 5) sleep(100);
		if (dev.r(96) != 3)
		{
			print("CS not ready");
			return 0;
		}
	}
	
	// qrr
	if (mme_use_QRR)
	{
		dev.nid(mme_Nid_QRR);
		if (dev.r(192) == 0) dev.c(1);
		if (dev.r(192) != 4)
		{
			print("QRR not ready");
			return 0;
		}
	}
	
	return 1;
}

function MME_CS(Force)
{
	if (mme_use_CS)
	{
		dev.nid(mme_Nid_CS);
		if (Force == 0)
		{
			dev.c(104);
			while (dev.r(96) != 3) sleep(500);
		}
		else
		{
			dev.w(70, Force * 10);
			dev.w(71, mme_cs_height);
			if (dev.r(96) == 3)
			{
				dev.c(102);
			}
			else if (dev.r(96) == 8)
			{
				dev.c(103);
			}
			while (dev.r(96) != 8) sleep(500);
			print("Force,kN: " + (dev.r(110) / 10));
		}
	}
}

function MME_CU(CMD)
{
	dev.nid(mme_Nid_CU);
	dev.c(CMD);
}

function MME_GTU()
{
	if (mme_use_GTU)
	{
		gtu_plot = mme_plot;
		dev.nid(mme_Nid_GTU);
		GTU_All(1, 0);
	}
}

function MME_GTUSL(Current, Force)
{
	// prepare cu
	dev.nid(mme_Nid_CU);
	if (dev.r(96) == 0)
	{
		dev.c(1);
		if (dev.r(96) != 3)
		{
			print("CU in abnormal state");
			PrintStatus();
			return;
		}
	}
	else if (dev.r(96) != 3)
	{
		print("CU in abnormal state");
		PrintStatus();
		return;
	}
	else
	{
		dev.c(116);
		print("CU ok");
	}
	
	// prepare gtu
	dev.nid(mme_Nid_GTU);
	if (dev.r(192) != 0)
	{
		print("GTU in abnormal state");
		PrintStatus();
		return;
	}
	else
	{
		print("GTU ok");
	}
	
	// prepare sl
	dev.nid(mme_Nid_SL)
	if (dev.r(192) == 0)
	{
		dev.c(1);
		print("SL power on...");
	}
	while (dev.r(192) == 3) sleep(50);
	if (dev.r(192) != 4)
	{
		print("SL in abnormal state");
		PrintStatus();
		return;
	}
	else
	{
		print("SL ok");
	}
	
	// prepare clamp
	dev.nid(mme_Nid_CS);
	if (dev.r(96) == 0)
	{
		dev.c(100);
		print("CS homing...");
	}
	while (dev.r(96) == 5) sleep(50);
	if (dev.r(96) != 3)
	{
		print("CS in abnormal state");
		PrintStatus();
		return;
	}
	else
	{
		print("CS clamping...");
		dev.w(70, Force * 10);
		dev.w(71, 50);
		dev.c(102);
		
		while (dev.r(96) == 7) sleep(50);
		
		if (dev.r(96) != 8)
		{
			print("CS in abnormal state");
			PrintStatus();
			return;
		}
		else
		{
			print("CS ok");
		}
	}
	
	// activate gtu
	dev.nid(mme_Nid_GTU);
	dev.w(130, 1);
	dev.w(151, 4)
	dev.c(102);
	
	// activate sl
	dev.nid(mme_Nid_SL);
	sl_rep = 1;
	dev.w(162, 1);
	dev.w(163, 1);
	
	sleep(20);
	SL_Sin(Current);
	
	// read gtu
	dev.nid(mme_Nid_GTU);
	while(dev.r(192) == 5) sleep(50);
	dev.w(130, 0);
	if (dev.r(197) == 2) print("problem: " + dev.r(196));
	print("Ih,   mA: " + dev.r(201));
	print("Trig    : " + dev.r(230));
	print("Toler   : " + dev.r(231));
	print("Finish  : " + dev.r(232));
	plot(dev.rafs(1), 1, 0);
	
	// recommutate
	dev.nid(mme_Nid_CU);
	dev.c(111);
	print("CU ok");
	
	// measure in ordinary way
	dev.nid(mme_Nid_GTU);
	dev.w(130, 0);
	GTU_Holding();
	
	// release clamp
	dev.nid(mme_Nid_CS);
	dev.c(104);
	print("CS unclamp...");
	while(dev.r(96) == 10) sleep(50);
	if (dev.r(96) != 3)
	{
		print("CS in abnormal state");
		PrintStatus();
		return;
	}
	else
	{
		print("CS ok");
	}
}

function MME_SL(Current)
{
	if (mme_use_SL)
	{
		dev.nid(mme_Nid_SL);
		dev.w(160, 3)
		LSLH_StartMeasure(Current);
		if (mme_plot) SL_Plot();
	}
}

function MME_BVT()
{
	if (mme_use_BVT)
	{
		dev.nid(mme_Nid_BVT);
		BVT_StartPulse(1, mme_bvt_voltage, mme_bvt_current * 10);
		if (mme_plot) BVT_PlotXY();
	}
}

function MME_QRR()
{
	if (mme_use_QRR)
	{
		dev.nid(mme_Nid_QRR);
		QRR_Start(mme_qrr_mode, mme_qrr_current, mme_qrr_current_rate, mme_qrr_voltage, mme_qrr_voltage_rate);
	}
}

function MME_ResetA()
{
	GTU_ResetA();
	SL_ResetA();
	BVT_ResetA();
}

function MME_Test(UnitArray, Counter, Pause, SLCurrent)
{	
	if (!MME_IsReady())
	{
		print("System not ready, exit");
		print("-------------");
		return;
	}
	else
	{
		print("System is ready");
		print("-------------");
	}
	
	for (var i = 0; i < Counter; i++)
	{
		for (var j = 0; j < UnitArray.length; j++)
		{
			switch (UnitArray[j])
			{
				case mme_GTU:
					print("#GTU");
					MME_CS(mme_cs_def_force);
					MME_CU(111);
					MME_GTU();
					MME_CU(110);
					break;
				case mme_SL:
					print("#SL");
					MME_CS(mme_cs_force);
					MME_CU(112);
					MME_SL(SLCurrent);
					MME_CU(110);
					break;
				case mme_BVTD:
					print("#BVTD");
					bvt_direct = 1;
					MME_CS(mme_cs_def_force);
					MME_CU(113);
					MME_BVT();
					MME_CU(110);
					break;
				case mme_BVTR:
					print("#BVTR");
					bvt_direct = 0;
					MME_CS(mme_cs_def_force);
					MME_CU(114);
					MME_BVT();
					MME_CU(110);
					break;
				case mme_CSDEF:
					print("#CSDEF");
					MME_CS(mme_cs_def_force);
					sleep(2000);
					print("-------------");
					break;
				case mme_CSMAX:
					print("#CS");
					MME_CS(mme_cs_force);
					sleep(2000);
					print("-------------");
					break;
				case mme_QRR:
					print("#QRR");
					MME_CU(115);
					MME_QRR();
					MME_CU(110);
					break;
			}
		}
		
		MME_CU(110);
		MME_CS(0);
		
		// get time
		var d = new Date();
		print(d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds());
		
		// get temperature
		if (mme_use_CS)
		{
			print("Temp1, C: " + (dev.r(101) / 10));
			print("Temp2, C: " + (dev.r(102) / 10));
		}
	
		print("Global counter: " + (++mme_counter));
		print("-------------");
		
		if (Counter > 1) sleep(Pause);
		if (anykey()) return 0;
	}
	
	return 1;
}

function MME_SafetyPos(Num, Pos)
{
	for (var i = 0; i < Num; i++)
	{
		dev.nid(mme_Nid_CU);
		dev.c(100);
		dev.c(112);

		dev.nid(mme_Nid_CS);
		if (!CS_Pos(3, Pos))
		{
			dev.nid(mme_Nid_CU);
			sleep(2000);
			dev.c(101);
			
			dev.nid(mme_Nid_CS);
			dev.w(64, 0);
			sleep(5000);
		}
		
		if (anykey()) return;
	}
}

function MME_SafetyClamp(Num, Force)
{
	for (var i = 0; i < Num; i++)
	{
		dev.nid(mme_Nid_CU);
		dev.c(100);
		dev.c(112);

		dev.nid(mme_Nid_CS);
		if (!CS_Clamp(3, Force))
		{
			dev.nid(mme_Nid_CU);
			sleep(2000);
			dev.c(101);
			
			dev.nid(mme_Nid_CS);
			dev.c(104);
			sleep(5000);
		}
		
		if (anykey()) return;
	}
}
