import { ApiResponse } from "apisauce"
import { Api } from "./api"
import { stationsObject, stationLocale } from "../../data/stations"
import { RailApiGetRoutesResult } from "./api.types"
import { isOneHourDifference, parseApiDate, parseRouteDuration } from "../../utils/helpers/date-helpers"
import { RouteItem } from "."

export class RouteApi {
  private api: Api

  constructor(api: Api) {
    this.api = api
  }

  async getRoutes(originId: string, destinationId: string, date: string, hour: string): Promise<RouteItem[]> {
    if (!originId || !destinationId) throw new Error("Missing origin / destination data")

    try {
      const response: ApiResponse<RailApiGetRoutesResult> = await this.api.apisauce.get(
        `searchTrainLuzForDateTime?fromStation=${originId}&toStation=${destinationId}&date=${date}&hour=${hour}&scheduleType=1&systemType=2&languageId=Hebrew`,
      )
      console.log(response)
      const { travels } = response.data.result

      // if (responseData.Error !== null) throw new Error(responseData.Error.Description)

      // const delays = responseData.Delays.reduce((delaysObject, delayItem) => {
      //   return Object.assign({}, delaysObject, { [delayItem.Train]: parseInt(delayItem.Min) })
      // }, {})

      // const crowdDetails = responseData.Omasim

      const formattedRoutes = travels.map((route) => {
        const trains = route.trains.map((train) => {
          const {
            orignStation,
            destinationStation,
            departureTime,
            arrivalTime,
            originPlatform,
            destPlatform,
            trainNumber,
            routeStations,
          } = train

          const stopStations = train.stopStations.map((station) => {
            const { stationId } = station
            const stationName = stationsObject[stationId][stationLocale]

            return {
              ...station,
              departureTime: new Date(station.departureTime).getTime(),
              arrivalTime: new Date(station.arrivalTime).getTime(),
              stationName,
            }
          })

          // The last stop is fetched from the "crowded" details
          // const trainCrowdDetail = crowdDetails.find((detail) => detail.TrainNumber === Number(Trainno))
          // const lastStationId = trainCrowdDetail.Stations[trainCrowdDetail.Stations.length - 1].StationNumber
          const lastStationId = routeStations[routeStations.length - 1].stationId

          const route = {
            // delay: delays[Trainno] || 0,
            originStationId: orignStation,
            originStationName: stationsObject[orignStation][stationLocale],
            destinationStationId: destinationStation,
            destinationStationName: stationsObject[destinationStation][stationLocale],
            departureTime: new Date(departureTime).getTime(),
            arrivalTime: new Date(arrivalTime).getTime(),
            originPlatform: originPlatform,
            destinationPlatform: destPlatform,
            lastStop: stationsObject[lastStationId][stationLocale],
            trainNumber,
            stopStations,
          }

          return route
        })

        return {
          departureTime: route.departureTime,
          // isExchange: IsExchange,
          // estTime: EstTime,
          // delay: trains[0].delay,
          trains,
        }
      })

      const routesWithWarning = formattedRoutes.map((route) => {
        const isMuchLonger = isRouteIsMuchLongerThanOtherRoutes(route as RouteItem, formattedRoutes as RouteItem[])
        const isMuchShorter = isRouteMuchShorterThanOtherRoutes(route as RouteItem, formattedRoutes as RouteItem[])
        return Object.assign({}, route, { isMuchShorter, isMuchLonger })
      })

      return routesWithWarning
    } catch (err) {
      console.error(err)
    }
  }
}

function isRouteIsMuchLongerThanOtherRoutes(route: RouteItem, otherRoutes: RouteItem[]): boolean {
  const routeDuration = parseRouteDuration(route.estTime)

  // TODO: Iterate only on the routes that are 1 hour around the route
  // currently we iterating on all the routes which is unecessary

  // iterate on routes that are before and after 1 hour the current route,
  // and check if they're shorther by 30 minutes or more than the current route.
  const longRoutesAround = otherRoutes.filter((otherRoute) => {
    const withinRange = isOneHourDifference(route.trains[0].departureTime, otherRoute.trains[0].departureTime)
    if (!withinRange) return false

    // check if the other route is much longer than the current route
    const otherRouteDuration = parseRouteDuration(otherRoute.estTime)
    return routeDuration - otherRouteDuration >= 30 * 60 * 1000
  })

  if (longRoutesAround.length > 0) return true
  return false
}

function isRouteMuchShorterThanOtherRoutes(route: RouteItem, otherRoutes: RouteItem[]): boolean {
  const routeDuration = parseRouteDuration(route.estTime)

  const shortRoutesAround = otherRoutes.filter((otherRoute) => {
    const withinRange = isOneHourDifference(route.trains[0].departureTime, otherRoute.trains[0].departureTime)
    if (!withinRange) return false

    // check if the other route is much shorter than the current route
    const otherRouteDuration = parseRouteDuration(otherRoute.estTime)
    return otherRouteDuration - routeDuration >= 30 * 60 * 1000
  })

  if (shortRoutesAround.length > 0) return true
  return false
}
