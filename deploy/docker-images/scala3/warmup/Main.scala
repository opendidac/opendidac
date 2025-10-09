object Main:
  def main(args: Array[String]): Unit =
    val stdin = scala.io.Source.stdin.getLines().mkString

    if stdin.isEmpty then
      println("Please provide an array in the format: [1,2,3,4]")
    else
      val input = stdin.stripPrefix("[").stripSuffix("]")
      val numbers = input.split(",").map(_.trim.toInt).toList

      val sortedNumbers = quickSort(numbers)
      println(sortedNumbers.mkString(", "))

  def quickSort(list: List[Int]): List[Int] = list match
    case Nil => Nil
    case pivot :: tail =>
      val (less, greater) = tail.partition(_ <= pivot)
      quickSort(less) ::: pivot :: quickSort(greater)