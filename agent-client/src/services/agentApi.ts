import axios from 'axios';

export const sendMessageToAgent = async (userInput: string) => {
  console.log("🚀 ~ sendMessageToAgent ~ userInput:", userInput)
  const {data } = await axios.post('http://localhost:4000/agent/message', { userInput });
  console.log("🚀 ~ sendMessageToAgent ~ response:", data)
  return data.response.parameters;

};
