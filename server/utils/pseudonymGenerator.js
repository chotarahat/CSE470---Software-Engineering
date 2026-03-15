const adjective = [
    "silent",
    "calm",
    "brave",
    "bright",
    "wise"
];
const animals=[
    "fox",
    "tiger",
    "eagle",
    "panda",
    "wolf"
];
function generatePseudonym(){
    const adj = adjective[Math.floor(Math.random()* adjective.length)];
    const animal=animals[Math.floor(Math.random()*animals.length)];
    const number=Math.floor(Math.random()*100);
    return `${adj}${animal}${number}`;
}
module.exports=generatePseudonym;