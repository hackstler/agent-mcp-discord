

# 🧠 Primero: Fundamentos esenciales

---

## 📌 ¿Qué es un grafo?

**Un grafo** es una estructura de datos que representa:
- **Nodos** (también llamados **vértices**)
- **Aristas** (también llamados **edges**), que son conexiones entre nodos.

Un ejemplo visual sencillo:

```
[A] --> [B] --> [C]
```
Aquí:
- `[A]`, `[B]`, `[C]` = nodos (vértices)
- `-->` = aristas (edges)

Un grafo puede representar:
- Flujos de trabajo
- Relaciones entre objetos
- Caminos o rutas (en juegos, redes, etc.)

---

## 📌 ¿Qué es un vértice (nodo)?

**Un vértice (nodo)** es **una entidad que hace algo** o **guarda información**.

En LangGraph:
- Cada **nodo** es una **operación** o **paso**.
- Un **nodo** puede ser: leer mensajes, generar un resumen, crear un issue, etc.

---

## 📌 ¿Qué es un edge (arista)?

**Una arista** es **el flujo que conecta dos nodos**.

En LangGraph:
- `addEdge('A', 'B')` significa:
  > Después de ejecutar el nodo A, ve al nodo B.

Controla el **orden de ejecución**.

---

## 📌 ¿Qué es StateGraph en LangGraph?

`StateGraph` es una **clase** que:
- Define los **nodos** que tienes.
- Define cómo se **conectan** esos nodos (**edges**).
- Gestiona un **state** que fluye y se actualiza entre los nodos.

> Un `StateGraph` es literalmente un **grafo de funciones** que se ejecutan una tras otra pasando y modificando un `state`.

---

## 📌 ¿Qué es Annotation en LangGraph?

`Annotation`:
- Define **qué datos existen en el `state`**.
- Define **cómo se actualizan** esos datos (por ejemplo, si solo guarda el último valor o si acumula).

LangGraph necesita saber de antemano **qué forma tiene tu estado** para poder moverse bien entre nodos.

---

## 📌 ¿Qué es Runnable y RunnableLambda?

- **Runnable**: cualquier cosa que puedes `.invoke(input)` y devuelve una salida.
- **RunnableLambda**: una **función anónima** (lambda) que se puede usar como nodo en LangGraph **sin tener que escribir clases completas**.

Si tu función es más simple, puedes pasarla directamente (`async (state) => {}`) como vimos en `agentGraph.ts`.  
Pero si quieres cumplir la "interfaz Runnable" de LangGraph, se recomienda usar `RunnableLambda({ func: async (state) => {}})`.

---

## 📌 ¿Por qué en `agentGraph.ts` NO usamos `RunnableLambda`?

Muy buena observación.

Cuando haces:

```ts
.addNode('fetchGuild', async (state) => { ... })
```

estás usando **una función normal**, y **LangGraph internamente la convierte** en un `Runnable`.

LangGraph permite:
- Si pasas una `async function` directamente, **te la envuelve automáticamente**.
- Pero si quieres tener más control o composición avanzada, **tú mismo puedes envolverla en un `RunnableLambda`**.

✅ **Conclusión:** En `agentGraph.ts` pasamos funciones normales porque **son simples**, no necesitamos construir `RunnableLambda` explícitamente.  
Solo cuando quieres hacer funciones más personalizadas, trazables o configurables usas `RunnableLambda`.

---

# 🔥 VAMOS A DEFINIR TODO CLARAMENTE PARA ENTREVISTA

| Concepto | Definición corta | Ejemplo real |
|:---------|:-----------------|:-------------|
| **Grafo** | Estructura de nodos conectados por aristas | Flujos de herramientas (crear canal, leer mensajes, etc.) |
| **Nodo (Vértice)** | Un paso o función que modifica el estado | Crear un rol en Discord |
| **Arista (Edge)** | Conexión entre nodos, marca el orden de ejecución | Después de crear canal → leer mensajes |
| **StateGraph** | Grafo de nodos que manejan un `state` que fluye | Modelo de ejecución de LangGraph |
| **Annotation** | Define el esquema de datos que viaja entre nodos | userInput, summary, etc. |
| **Runnable** | Algo que puedes invocar | Un modelo, una función, etc. |
| **RunnableLambda** | Forma de construir un runnable desde una función pequeña | `new RunnableLambda({ func: async (state) => {...} })` |

---

# 🎯 Resumen de LangGraph

> LangGraph es una librería que nos permite modelar agentes inteligentes como **grafos de funciones**. Cada función o nodo puede interactuar con modelos LLM, herramientas externas o procesar estados intermedios. El flujo entre nodos es explícito usando aristas, y el estado es tipado y gestionado dinámicamente mediante anotaciones. Esto nos da control total sobre la ejecución de agentes complejos, de forma modular y escalable.

