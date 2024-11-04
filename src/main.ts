// todo
const app: HTMLDivElement = document.querySelector("#app")!;

const button = document.createElement("button");
button.innerHTML = "click here!";
app.append(button);

const message: string = "you clicked the button!";
button.addEventListener("click", () => alert(message));
