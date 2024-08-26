class Lift {
  constructor(id, totalFloors) {
    this.id = id;
    this.currentFloor = 1;
    this.isBusy = false;
    this.targetFloor = null;
    this.totalFloors = totalFloors;
    this.element = this.createLiftElement();
    this.speed = 1; // Floors per second
    this.direction = null;
  }

  createLiftElement() {
    const element = document.createElement("div");
    element.id = this.id;
    element.className = "lift";
    element.style.bottom = "0px";

    const doors = document.createElement("div");
    doors.className = "lift-doors";

    const leftDoor = document.createElement("div");
    leftDoor.className = "lift-door left";

    const rightDoor = document.createElement("div");
    rightDoor.className = "lift-door right";

    doors.appendChild(leftDoor);
    doors.appendChild(rightDoor);
    element.appendChild(doors);

    return element;
  }

  async moveTo(floor) {
    const floorHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--floor-height'));
    const currentPosition = (this.currentFloor - 1) * floorHeight;
    const targetPosition = (floor - 1) * floorHeight;
    const distance = Math.abs(targetPosition - currentPosition);
    const duration = distance / (this.speed * floorHeight);

    this.element.style.transition = `bottom ${duration}s linear`;
    this.element.style.bottom = `${targetPosition}px`;

    return new Promise((resolve) => {
      setTimeout(() => {
        this.currentFloor = floor;
        resolve();
      }, duration * 1000);
    });
  }

  async performFloorOperation() {
    await this.openDoors();
    await this.delay(1500);
    await this.closeDoors();
    this.direction = null;
  }

  async openDoors() {
    const leftDoor = this.element.querySelector(".lift-door.left");
    const rightDoor = this.element.querySelector(".lift-door.right");
    leftDoor.classList.add("open");
    rightDoor.classList.add("open");
    await this.delay(1000);
  }

  async closeDoors() {
    const leftDoor = this.element.querySelector(".lift-door.left");
    const rightDoor = this.element.querySelector(".lift-door.right");
    leftDoor.classList.remove("open");
    rightDoor.classList.remove("open");
    await this.delay(1000);
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

class LiftSystem {
  constructor(floorCount, liftCount) {
    this.floorCount = floorCount;
    this.liftCount = liftCount;
    this.lifts = [];
    this.requestQueue = [];
    this.buildingElement = document.getElementById("building");
    this.initialize();
  }

  initialize() {
    this.createFloors();
    this.createLifts();
    this.updateLiftPositions();
    this.updateBuildingHeight();
  }

  createFloors() {
    this.buildingElement.innerHTML = "";
    const floorHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--floor-height'));

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
  updateBuildingHeight() {
    const floorHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--floor-height'));
    document.documentElement.style.setProperty('--building-height', `${floorHeight * this.floorCount}px`);
  }

  createLifts() {
    for (let i = 0; i < this.liftCount; i++) {
      const lift = new Lift(
        `lift${i + 1}`,
        this.floorCount,
        this.buildingHeight
      );
      this.lifts.push(lift);
      this.buildingElement.appendChild(lift.element);
    }
  }

  updateLiftPositions() {
    const buildingWidth = this.buildingElement.offsetWidth;
    const liftWidth =
      parseInt(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--lift-width"
        )
      ) || 80;
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

  isLiftAvailableForRequest(floor, direction) {
    return this.lifts.some(
      (lift) =>
        (lift.currentFloor === floor && lift.direction === direction) ||
        (lift.isBusy &&
          lift.targetFloor === floor &&
          lift.direction === direction)
    );
  }

  async callLift(floor, direction) {
    if (this.isLiftAvailableForRequest(floor, direction)) {
      console.log(
        `Lift already available or moving to floor ${floor} for ${direction} direction`
      );
      return;
    }

    this.requestQueue.push({ floor, direction });
    this.processQueue();
  }

  async processQueue() {
    if (this.requestQueue.length === 0) return;

    const availableLift = this.findAvailableLift();
    if (!availableLift) return;

    const request = this.requestQueue.shift();
    availableLift.isBusy = true;
    availableLift.targetFloor = request.floor;
    availableLift.direction = request.direction; // Set direction for the lift

    await this.processLiftRequest(availableLift, request.floor);

    availableLift.isBusy = false;
    availableLift.targetFloor = null;
    availableLift.direction = null;
    this.processQueue();
  }

  async processLiftRequest(lift, floor) {
    console.log(`Lift ${lift.id} moving to floor ${floor}`);
    await lift.moveTo(floor);
    await lift.performFloorOperation();
    console.log(`Lift ${lift.id} completed operation at floor ${floor}`);
  }
}

let liftSystem;

document.getElementById("initializeBtn").addEventListener("click", () => {
  const floorCount = parseInt(document.getElementById("floorCount").value);
  const liftCount = parseInt(document.getElementById("liftCount").value);
  if (!floorCount || !liftCount || floorCount < 1 || liftCount < 1) {
    alert("Please enter valid values for floor count and lift count.");
    return;
  }

  try {
    liftSystem = new LiftSystem(floorCount, liftCount);

    document.querySelectorAll(".button").forEach((button) => {
      button.addEventListener("click", (event) => {
        const floor = parseInt(event.target.dataset.floor);
        const direction = event.target.dataset.direction;
        liftSystem.callLift(floor, direction);
      });
    });
  } catch (error) {
    console.error("Error initializing lift system:", error.message);
    alert(
      "Error initializing lift system. Please check the console for details."
    );
  }
});

window.addEventListener("resize", () => {
  if (liftSystem) {
    liftSystem.updateLiftPositions();
  }
});
