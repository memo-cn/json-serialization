var animal = {
    name: 'cat',
    eat() {
        console.log('eat', ...arguments);
    },
    sleep() {
        console.log('sleep', ...arguments);
    },
};

import { stringify, parse } from 'json-serialization';
import { createFunctionSerDes } from '../lib/index';

var clientSerDes = createFunctionSerDes(new BroadcastChannel('test'));

/**
 * A possible serialization result:
 * [
 *     {
 *         "name": "scat",
 *         "eat": "f8a8b44e1-41ca-4454-a281-2ba6eb9265c6",
 *         "sleep": "fc993b3cd-c8ee-44ed-9117-6c457f5bd800"
 *     },
 *     "f8a8b44e1-41ca-4454-a281-2ba6eb9265c6",
 *     "fc993b3cd-c8ee-44ed-9117-6c457f5bd800"
 * ]
 */
var json = await stringify([animal, animal.eat, animal.sleep], [clientSerDes.serializer], 4);

var serverSerDes = createFunctionSerDes(new BroadcastChannel('test'));
/**
 * [
 *     {
 *         name: "cat",
 *         eat: proxyFunction<link to eat>,
 *         sleep: proxyFunction<link to sleep>,
 *     },
 *     proxyFunction<link to eat>,
 *     proxyFunction<link to sleep>,
 * ]
 */
var object = await parse(json, [serverSerDes.deserializer]);

// console output: eat fish
object[0].eat('fish');

// unreferencing function on the client
clientSerDes.unref(animal.eat);

// or unreferencing function on the server
serverSerDes.unref(object[1]);

// console has no output
object[0].eat('fish');
