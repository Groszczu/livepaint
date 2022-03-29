package utils

func Contains[T comparable](collection []T, tested T) bool {
	for _, elem := range collection {
		if elem == tested {
			return true
		}
	}
	return false
}
