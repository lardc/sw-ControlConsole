include("PrintStatus.js")

function FWUpdate(FileName)
{
	print("Current node id equal " + dev.GetNodeID() + ". Confirm execution pressing 'y' or exit pressing 'n'.");
	var key = 0;
	do
	{
		key = readkey();
	}
	while (key != "y" && key != "n")
	
	if (key == "n")
	{
		print("Exit.");
		return;
	}
	
	var fl_array = loadtihex(FileName);
	var VAL_REGEXP = RegExp("^[0-9a-fA-F]{2}$");
	var BLOCK_SIZE = 300;		// Write buffer size
	var ArrayIndex = 0;			// Current array index
	var WriteBuffer = [];		// Transmit buffer
	var Progress = 0;			// For progress display
	var XOR = 0;				// XOR checksum
	var Build16Trigger = 0;		// Trigger for building 16bit values
	var Build16Data = 0;		// 16bit value
	var Num16bParts = 0;		// Number of uncompleted 16bit parts
	
	// reset device
	dev.c(320);
	sleep(500);
	
	//---------------------------
	print("Erasing SECTOR C...");
	dev.c(302);
	print("Erasing SECTOR D...");
	dev.c(303);
	//---------------------------
	
	// reset counters
	sleep(100);
	dev.c(308);
	
	print("Writing data...");
	while (ArrayIndex < fl_array.length)
	{		
		if (VAL_REGEXP.test(fl_array[ArrayIndex]))
		{
			// [data element]
			
			var curVal = parseInt(fl_array[ArrayIndex], 16);
			
			// display progress
			if (ArrayIndex > ((fl_array.length / 10) * Progress))
			{
				print((Progress * 10) + "%");
				Progress++;
			}
			
			// fill block buffer
			if (WriteBuffer.length < BLOCK_SIZE)
			{
				if (Build16Trigger == 0)
				{
					Build16Data = curVal << 8;
					Build16Trigger = 1;
				}
				else
				{
					Build16Data |= curVal;
					Build16Trigger = 0;
					XOR ^= Build16Data;
					WriteBuffer.push(Build16Data);
				}
				
				// only after processing value
				ArrayIndex++;
			}
			else
			{
				// write to processor
				dev.wa(1, WriteBuffer);
				dev.c(310);
				
				// reset buffer
				WriteBuffer = [];
			}
		}
		else
		{
			// [address element]
			
			if (WriteBuffer.length > 0)
			{
				// write to processor
				dev.wa(1, WriteBuffer);
				dev.c(310);
				
				// for uncompleted operation
				if (Build16Trigger) Num16bParts++;
				Build16Trigger = 0;
				
				// reset buffer
				WriteBuffer = [];
			}
			
			// set address
			var curAddr = parseInt(fl_array[ArrayIndex], 16);
			ArrayIndex++;
			
			dev.w(2, curAddr & 0xffff);				// low part
			dev.w(3, (curAddr >> 16) & 0xffff);		// high part
			dev.c(309);
			
			XOR ^= curAddr & 0xffff;
			XOR ^= (curAddr >> 16) & 0xffff;
		}
	}
	
	if (WriteBuffer.length > 0)
	{
		// write to processor
		dev.wa(1, WriteBuffer);
		dev.c(310);
		
		// reset buffer
		WriteBuffer = [];
	}
	
	// diag output
	if (Num16bParts)
		print("Number of uncompleted words: " + Num16bParts);
	
	// compare XOR values
	if (XOR == dev.r(10))
	{
		print("100%");
		print("Checksum OK");
		
		dev.w(4, XOR);
		dev.c(311);
		
		print("Firmware update completed");
	}
	else
	{
		print("Checksum missmatch, process aborted");
	}
}
// GTU
function FWU_GTU(Version)
{
	if (typeof Version == 'undefined')
	{
		print("Error. Define software version.");
		return;
	}
	else
		FWUpdate("../../../../../../../Gate Test Unit/Controllers soft/Version " + Version + "/GateTester/Release/GateTester.hex");
}

function FWU_DumpGTU(Version)
{
	if (typeof Version == 'undefined')
	{
		print("Error. Define software version.");
		return;
	}
	else
		dev.Dump("../../../../../../../Gate Test Unit/Controllers soft/Version " + Version + "/GateTester/gtu.regdump", 0, 126);
}

function FWU_RestoreGTU(Version)
{
	if (typeof Version == 'undefined')
	{
		print("Error. Define software version.");
		return;
	}
	else
		dev.Restore("../../../../../../../Gate Test Unit/Controllers soft/Version " + Version + "/GateTester/gtu.regdump");
}
//------------------------

// BVT
function FWU_BVT(Version)
{
	if (typeof Version == 'undefined')
	{
		print("Error. Define software version.");
		return;
	}
	else
		FWUpdate("../../../../../../../Blocking Voltage Tester/Controllers soft/Version " + Version + "/BVTMainBoard/Release/BVTControlBoard.hex");
}

function FWU_DumpBVT(Version)
{
	if (typeof Version == 'undefined')
	{
		print("Error. Define software version.");
		return;
	}
	else
		dev.Dump("../../../../../../../Blocking Voltage Tester/Controllers soft/Version " + Version + "/BVTMainBoard/bvthp.regdump", 0, 126);
}

function FWU_RestoreBVT(Version)
{
	if (typeof Version == 'undefined')
	{
		print("Error. Define software version.");
		return;
	}
	else
		dev.Restore("../../../../../../../Blocking Voltage Tester/Controllers soft/Version " + Version + "/BVTMainBoard/bvthp.regdump");
}
//------------------------

// SLH
function FWU_SLH(Version)
{
	if (typeof Version == 'undefined')
	{
		print("Error. Define software version.");
		return;
	}
	else
		FWUpdate("../../../../../../../Static Losses/SLH/Controller Soft/Version " + Version + "/VTMControlBoard/Release/VTMControlBoard.hex");
}

function FWU_DumpSLH(Version)
{
	if (typeof Version == 'undefined')
	{
		print("Error. Define software version.");
		return;
	}
	else
		dev.Dump("../../../../../../../Static Losses/SLH/Controller Soft/Version " + Version + "/VTMControlBoard/slh.regdump", 0, 126);
}

function FWU_RestoreSLH(Version)
{
	if (typeof Version == 'undefined')
	{
		print("Error. Define software version.");
		return;
	}
	else
		dev.Restore("../../../../../../../Static Losses/SLH/Controller Soft/Version " + Version + "/VTMControlBoard/slh.regdump");
}
//------------------------

// CU
function FWU_CU(Version)
{
	if (typeof Version == 'undefined')
	{
		print("Error. Define software version.");
		return;
	}
	else
		FWUpdate("../../../../../../../Commutation Unit/High Voltage/CU HV/Controller Soft/Version " + Version + "/CUControlBoard/Release/CUControlBoard.hex");
}
//------------------------

function FWU_DumpCU(Version)
{
	if (typeof Version == 'undefined')
	{
		print("Error. Define software version.");
		return;
	}
	else
		dev.Dump("../../../../../../../Commutation Unit/High Voltage/CU HV/Controller Soft/Version " + Version + "/CUControlBoard/cu.regdump", 0, 126);
}

// ControlUnit
function FWU_ControlUnit(Version)
{
	if (typeof Version == 'undefined')
	{
		print("Error. Define software version.");
		return;
	}
	else
		FWUpdate("../../../../../../../HMI Unit/Controllers soft/Version " + Version + "/ControlUnit/Release/ControlUnit.hex");
}
//------------------------

// dVdt
function FWU_CROVU(Version)
{
	if (typeof Version == 'undefined')
	{
		print("Error. Define software version.");
		return;
	}
	else
		FWUpdate("../../../../../../../CROVU/Controller soft/Version " + Version + "/dVdtControlBoard/Release/dVdtControlBoard.hex");
}

function FWU_DumpCROVU(Version)
{
	if (typeof Version == 'undefined')
	{
		print("Error. Define software version.");
		return;
	}
	else
		dev.Dump("../../../../../../../CROVU/Controller soft/Version " + Version + "/dVdtControlBoard/dvdt.regdump", 0, 126);
}

function FWU_RestoreCROVU(Version)
{
	if (typeof Version == 'undefined')
	{
		print("Error. Define software version.");
		return;
	}
	else
		dev.Restore("../../../../../../../CROVU/Controller soft/Version " + Version + "/dVdtControlBoard/dvdt.regdump");
}
//------------------------

// FCROVU
function FWU_FCROVU(Version)
{
	if (typeof Version == 'undefined')
	{
		print("Error. Define software version.");
		return;
	}
	else
		FWUpdate("../../../../../../../QRR Tester/FCROVU/Controller soft/Version " + Version + "/dVdtControlBoard/Release/ForcedVdtControlBoard.hex");
}

function FWU_DumpFCROVU(Version)
{
	if (typeof Version == 'undefined')
	{
		print("Error. Define software version.");
		return;
	}
	else
		dev.Dump("../../../../../../../QRR Tester/FCROVU/Controller soft/Version " + Version + "/dVdtControlBoard/fdvdt.regdump", 0, 126);
}

function FWU_RestoreFCROVU(Version)
{
	if (typeof Version == 'undefined')
	{
		print("Error. Define software version.");
		return;
	}
	else
		dev.Restore("../../../../../../../QRR Tester/FCROVU/Controller soft/Version " + Version + "/dVdtControlBoard/fdvdt.regdump");
}
//------------------------

// CS
function FWU_CS(Version)
{
	if (typeof Version == 'undefined')
	{
		print("Error. Define software version.");
		return;
	}
	else
		FWUpdate("../../../../../../../Clamping Systems/CSCU/_Common/Controller Soft/Version " + Version + "/CSControlBoard/Release/CSControlBoard.hex");
}

function FWU_DumpCS(Version)
{
	if (typeof Version == 'undefined')
	{
		print("Error. Define software version.");
		return;
	}
	else
		dev.Dump("../../../../../../../Clamping Systems/CSCU/_Common/Controller Soft/Version " + Version + "/CSControlBoard/cs.regdump", 0, 62);
}

function FWU_RestoreCS(Version)
{
	if (typeof Version == 'undefined')
	{
		print("Error. Define software version.");
		return;
	}
	else
		dev.Restore("../../../../../../../Clamping Systems/CSCU/_Common/Controller Soft/Version " + Version + "/CSControlBoard/cs.regdump");
}
//------------------------

// QSU
function FWU_QSU(Version)
{
	if (typeof Version == 'undefined')
	{
		print("Error. Define software version.");
		return;
	}
	else
		FWUpdate("../../../../../../../QRR tq/QRR tq LP/QSU/Controller soft/Version " + Version + "/QrrtqSyncBoard/Release/QrrtqSyncBoard.hex");
}

function FWU_DumpQSU(Version)
{
	if (typeof Version == 'undefined')
	{
		print("Error. Define software version.");
		return;
	}
	else
		dev.Dump("../../../../../../../QRR tq/QRR tq LP/QSU/Controller soft/Version " + Version + "/QrrtqSyncBoard/qsu.regdump", 0, 126);
}

function FWU_RestoreQSU(Version)
{
	if (typeof Version == 'undefined')
	{
		print("Error. Define software version.");
		return;
	}
	else
		dev.Restore("../../../../../../../QRR tq/QRR tq LP/QSU/Controller soft/Version " + Version + "/QrrtqSyncBoard/qsu.regdump");
}
//------------------------

// HMIU
function FWU_HMIU(Version)
{
	if (typeof Version == 'undefined')
	{
		print("Error. Define software version.");
		return;
	}
	else
		FWUpdate("../../../../../../../HMI Unit/Controllers soft/Version " + Version + "/ControlUnit/Release/ControlUnit.hex");
}
//------------------------