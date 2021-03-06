const MedicinePump = require("../dependencies/medicine-pump");
const HealthMonitor = require("../dependencies/health-monitor");
const AlertService = require("../dependencies/alert-service");
const DoseController = require("../src/dose-controller");

describe("Dose Controller", function () {
  beforeEach(function () {});

  //THE INITIAL CONDITIONS

  let medicinePump;
  let doseController;

  function given({ pressure }) {
    medicinePump = {
      dose: jest.fn(), //function that we're following
      getTimeSinceLastDoseInMinutes: function (medicine) {
        // we don't care what the implementation of this method is
      },
    };
    const healthMonitor = {
      getSystolicBloodPressure: function () {
        return pressure;
      },
    };
    const alertService = AlertService();

    doseController = DoseController(healthMonitor, medicinePump, alertService);
  }

  function dosedMedicine(medicinePump, { name, quantity }) {
    expect(medicinePump.dose).toBeCalledWith({ name, quantity });
  }

  //TESTS

  it("Gdy ciśnienie spadnie poniżej 90, podaj 1 dawkę leku podnoszącego ciśnienie.", () => {
    //given
    given({
      pressure: 89,
    });

    //when
    doseController.checkHealthAndApplyMedicine();

    //then
    dosedMedicine(medicinePump, {
      name: "RaisePressure",
      quantity: 1,
    });
  });

  it("Gdy ciśnienie spadnie poniżej 60, podaj 2 dawki leku podnoszącego ciśnienie.", () => {
    //given
    given({
      pressure: 59,
    });

    //when
    doseController.checkHealthAndApplyMedicine();

    //then
    dosedMedicine(medicinePump, {
      name: "RaisePressure",
      quantity: 2,
    });
  });

  it("Gdy ciśnienie wzrośnie powyżej 150, podaj lek obniżający ciśnienie.", () => {
    //given
    given({
      pressure: 151,
    });

    //when
    doseController.checkHealthAndApplyMedicine();

    //then
    dosedMedicine(medicinePump, {
      name: "LowerPressure",
      quantity: 1,
    });
  });

  it("Gdy pompa nie zadziała (może się to zdarzyć przy intensywnym ruchu ręką), ponów próbę.", () => {
    //given
    medicinePump = {
      dose: jest
        .fn()
        .mockReturnValueOnce(new Error("Zbyt szybki ruch ręką!")),
        //I THINK NOTHING HERE BECAUSE SECOND RETURNED VALUE SHOULD BE JUST FINE...or add the second call
        // .mockReturnValueOnce({
        //   name: "RaisePressure",
        //   quantity: 1,
        // }),
      getTimeSinceLastDoseInMinutes: function (medicine) {
        // we don't care what the implementation of this method is
      },
    };
    const healthMonitor = {
      getSystolicBloodPressure: function () {
        return 85;
      },
    };
    const alertService = AlertService();

    doseController = DoseController(healthMonitor, medicinePump, alertService);

    //when
    doseController.checkHealthAndApplyMedicine();

    //then
    console.log(medicinePump.dose.mock);

    console.log(medicinePump.dose.mock.calls[0]);
// almost!
    expect(medicinePump.dose.mock.results[0].value).toBe("
      [Error: Zbyt szybki ruch ręką!]"
    );

    expect(medicinePump.dose.mock.calls.length).toBe(2);
 
    expect(medicinePump.dose.argsFor(1)).toBeCalledWith({
      name: "LowerPressure",
      quantity: 1,
    });
  });
});
