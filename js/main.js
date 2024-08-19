class Lift {
  constructor(id, totalFloors) {
    this.id = id;
    this.currentFloor = 1;
    this.isBusy = false;
    this.totalFloors = totalFloors;
    this.element = this.createLiftElement();
  }

  createLiftElement() {
    const element = document.createElement("div");
    element.id = this.id;
    element.className = "lift";
    const floorHeight = 400 / this.totalFloors;
    element.style.height = `${floorHeight - 10}px`;
    element.style.bottom = "0px";
    element.textContent = this.id.replace("lift", "L");
    return element;
  }

  async moveTo(floor) {
    this.isBusy = true;
    const floorHeight = 400 / this.totalFloors;
    const distance = (floor - 1) * floorHeight;
    this.element.style.transition = "bottom 3s";
    this.element.style.bottom = `${distance}px`;

    return new Promise((resolve) => {
      setTimeout(() => {
        this.currentFloor = floor;
        this.isBusy = false;
        resolve();
      }, 3000);
    });
  }
}

class LiftSystem {
  constructor(floorCount, liftCount) {
    this.floorCount = floorCount;
    this.liftCount = liftCount;
    this.lifts = [];
    this.buildingElement = document.getElementById("building");
    this.pendingCalls = new Set();
    this.initialize();
  }

  initialize() {
    this.createFloors();
    this.createLifts();
    this.updateLiftPositions();
  }

  createFloors() {
    this.buildingElement.innerHTML = "";
    const floorHeight = 400 / this.floorCount;

    for (let i = this.floorCount; i > 0; i--) {
      const floor = document.createElement("div");
      floor.className = "floor";
      floor.style.height = `${floorHeight}px`;

      const label = document.createElement("span");
      label.className = "floor-label";
      label.textContent = `Floor ${i}`;

      const buttons = document.createElement("div");
      buttons.className = "buttons";

      if (i < this.floorCount) {
        const upButton = document.createElement("button");
        upButton.className = "button up";
        upButton.textContent = "Up";
        upButton.dataset.floor = i;
        upButton.dataset.direction = "up";
        buttons.appendChild(upButton);
      }

      if (i > 1) {
        const downButton = document.createElement("button");
        downButton.className = "button down";
        downButton.textContent = "Down";
        downButton.dataset.floor = i;
        downButton.dataset.direction = "down";
        buttons.appendChild(downButton);
      }

      floor.appendChild(buttons);
      floor.appendChild(label);
      this.buildingElement.appendChild(floor);
    }
  }

  createLifts() {
    for (let i = 0; i < this.liftCount; i++) {
      const lift = new Lift(`lift${i + 1}`, this.floorCount);
      this.lifts.push(lift);
      this.buildingElement.appendChild(lift.element);
    }
  }

  updateLiftPositions() {
    const buildingWidth = this.buildingElement.offsetWidth;
    const liftWidth = 80;
    const spacing = 30;
    const totalWidth =
      this.lifts.length * liftWidth + (this.lifts.length - 1) * spacing;
    const startX = (buildingWidth - totalWidth) / 2;

    this.lifts.forEach((lift, index) => {
      lift.element.style.left = `${startX + index * (liftWidth + spacing)}px`;
      lift.element.style.width = `${liftWidth}px`;
    });
  }

  findAvailableLift() {
    return this.lifts.find((lift) => !lift.isBusy);
  }

  async callLift(floor, direction) {
    const callId = `${floor}-${direction}`;
    if (this.pendingCalls.has(callId)) {
      console.log(`Call for floor ${floor} ${direction} already exists`);
      return;
    }

    this.pendingCalls.add(callId);
    await this.processCall(floor, direction);
    this.pendingCalls.delete(callId);
  }

  async processCall(floor, direction) {
    const availableLift = this.findAvailableLift();
    if (!availableLift) {
      console.log("All lifts are busy");
      return;
    }

    console.log(
      `Lift ${availableLift.id} moving to floor ${floor} for ${direction} direction`
    );
    await availableLift.moveTo(floor);
    console.log(`Lift ${availableLift.id} arrived at floor ${floor}`);
  }
}

let liftSystem;

document.getElementById("initializeBtn").addEventListener("click", () => {
  const floorCount = parseInt(document.getElementById("floorCount").value);
  const liftCount = parseInt(document.getElementById("liftCount").value);

  liftSystem = new LiftSystem(floorCount, liftCount);

  document.querySelectorAll(".button").forEach((button) => {
    button.addEventListener("click", (event) => {
      const floor = parseInt(event.target.dataset.floor);
      const direction = event.target.dataset.direction;
      liftSystem.callLift(floor, direction);
    });
  });
});
