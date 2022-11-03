include("PrintStatus.js")
include("CalGeneral.js")


function fdVdt_DiagPulse(Gate)
{
	dev.w(128, Gate);
	dev.c(10);
	dev.c(129);
}