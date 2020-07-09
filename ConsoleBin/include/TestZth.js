include("PrintStatus.js")
include("Tektronix.js")
include("CalGeneral.js")

arr_v = [];

function ADC()	// Single measurement 
{
	dev.c(6);
	a = dev.r(10);
	b = 5000*a/65536;
	print("Uin_adc [mV] = " + b);
	
	return;
}

function ADC_Collect(Num, Sleep)		// Serial measurement
{
	for (i = 0; i < Num; i++)
	{
		dev.c(6);
		arr_v[i] = dev.r(10);
		sleep(Sleep);
		if (anykey()) return;
	}
	for (i = 0; i < Num; i++)
	{
		b = 5000*arr_v[i]/65536;
		arr_v[i] = b;
	}
}

function ADC_Save(NameV)
{
	SaveArray(NameV, arr_v);
}

function ClrArray()
{
	for (var i = 0; i < arr_v.length; i++)
	arr_v[i] = 0;
}

function SaveArray(FileName, UnitData)
{
	var csv_array = [];
	
	for (var i = 0; i < UnitData.length; i++)
		csv_array.push(UnitData[i] + ";");
	
	save("TestZthDir/" + FileName + ".csv", csv_array);
}