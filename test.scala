object Main:
  def main(args: Array[String]): Unit =
    println("Hello from SBT-like Scala!")
    val numbers = List(5, 3, 8, 1, 2, 9, 4)
    val sorted = numbers.sorted
    println(sorted.mkString(", "))