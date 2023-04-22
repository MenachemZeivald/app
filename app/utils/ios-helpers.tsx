import { NativeModules } from "react-native"
import { RouteItem } from "../services/api"

const { RNBetterRail } = NativeModules

export function donateRouteIntent(originId: string, destinationId: string) {
  RNBetterRail.donateRouteIntent(originId, destinationId)
}

export function reloadAllTimelines() {
  RNBetterRail.reloadAllTimelines()
}

export function monitorLiveActivities() {
  RNBetterRail.monitorActivities()
}

function prepareDataForLiveActivities(route: RouteItem) {
  const modifiedRoute = { ...route }
  // @ts-expect-error
  modifiedRoute.arrivalTime = route.arrivalTimeString
  // @ts-expect-error
  modifiedRoute.departureTime = route.departureTimeString

  modifiedRoute.trains = modifiedRoute.trains.map((train) => {
    const modifiedTrain = { ...train }
    // @ts-expect-error
    modifiedTrain.arrivalTime = train.arrivalTimeString

    // @ts-expect-error
    modifiedTrain.departureTime = train.arrivalTimeString

    // @ts-expect-error
    modifiedTrain.destPlatform = train.destinationPlatform

    // @ts-expect-error
    modifiedTrain.orignStation = train.originStationId

    // @ts-expect-error
    modifiedTrain.destinationStation = train.destinationStationId

    modifiedTrain.stopStations = train.stopStations.map((stopStation) => {
      const modifiedStopStation = { ...stopStation }
      // @ts-expect-error
      modifiedStopStation.arrivalTime = stopStation.arrivalTimeString
      // @ts-expect-error
      modifiedStopStation.departureTime = stopStation.departureTimeString
      return modifiedStopStation
    })

    return modifiedTrain
  })

  return modifiedRoute
}

export async function startLiveActivity(route: RouteItem) {
  try {
    const modifiedRoute = prepareDataForLiveActivities(route)
    const routeJSON = JSON.stringify(modifiedRoute)

    const rideId = await RNBetterRail.startActivity(routeJSON)

    return rideId
  } catch (err) {
    console.log(err)
    throw err
  }
}

export async function endLiveActivity(routeId: string) {
  try {
    return await RNBetterRail.endActivity(routeId)
  } catch (err) {
    console.log(err)
    throw err
  }
}

export async function isRideActive(routeId: string) {
  const result: Boolean = await RNBetterRail.isRideActive(routeId)
  return result
}
